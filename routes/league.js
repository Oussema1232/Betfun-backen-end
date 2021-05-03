const express = require("express");

const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const nanoid = require("nanoid").nanoid;

const router = express.Router();

//create league
//transaction
router.post("/", auth, (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  if (!req.body.name)
    return res.status(400).send("The league must have a name");
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.body.domainId,
    (error, result) => {
      if (!result[0])
        return res.status(400).json({ message: "Domain not found" });
      if (error) return next(error);
      connexion.query(
        "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
        [req.body.userId, req.body.domainId],
        (error, result) => {
          if (!result[0])
            return res
              .status(400)
              .json({ message: "You are not registered at this domain" });
          if (error) return next(error);
          const code = nanoid(8);
          let newLeague = {
            name: req.body.name,
            code: code,
            genreId: req.body.genreId,
            seasonId: req.body.seasonId,
            domainId: req.body.domainId,
            creatorId: req.body.userId,
          };
          connexion.beginTransaction(function (err) {
            if (err) {
              return next(err);
            }
            connexion.query(
              "INSERT INTO leagues SET?",
              newLeague,
              function (err, results, fields) {
                if (err) {
                  return connexion.rollback(function () {
                    return next(err);
                  });
                }

                let newUserLeague = {
                  userId: req.body.userId,
                  leagueId: results.insertId,
                };

                connexion.query(
                  "INSERT INTO user_league SET?",
                  newUserLeague,
                  function (err, results, fields) {
                    if (err) {
                      return connexion.rollback(function () {
                        return next(err);
                      });
                    }

                    connexion.commit(function (err) {
                      if (err) {
                        return connexion.rollback(function () {
                          return next(err);
                        });
                      }
                      res.status(200).json({
                        message: "League created successfully",
                        data: code,
                      });
                    });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

//join league
router.post("/join", auth, (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  connexion.query(
    `SELECT * FROM leagues WHERE code=?`,
    req.body.code,
    function (err, results) {
      if (!results[0])
        return res
          .status(400)
          .json({ message: "No league found under this code" });
      if (err) return next(err);
      let leagueresult = results[0];
      connexion.query(
        `SELECT * FROM user_league WHERE userId=? AND leagueId=?`,
        [req.body.userId, leagueresult.id],
        function (err, results) {
          if (results[0])
            return res
              .status(400)
              .json({ message: "You are already registred in this league" });
          if (err) next(err);
          connexion.query(
            `
          SELECT * FROM user_domains
          JOIN betfun_domains
          ON betfun_domains.id=domainId
          WHERE userId=? AND domainId=?
          `,
            [req.body.userId, leagueresult.domainId],
            (error, result) => {
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "You are not registered in this domain" });
              if (error) return next(error);
              let q = `INSERT INTO user_league SET?`;
              let userleague = {
                userId: req.body.userId,
                leagueId: leagueresult.id,
              };
              connexion.query(q, userleague, function (err, results) {
                if (err) return next(err);
                if (results)
                  return res.status(200).json({
                    message: `You have successfully joined ${leagueresult.name}`,
                  });
              });
            }
          );
        }
      );
    }
  );
});

//delete leagues

router.delete("/", [auth, authoriz], (req, res) => {
  connexion.query("DELETE FROM leagues", function (err, results) {
    if (err) return next(err);
    if (results)
      return res.status(200).json({ message: `leagues table deleted` });
  });
});

//order of users in a specific league (and specific month) and specific season
router.get("/rank/:leagueId/:seasonId/:month", auth, (req, res, next) => {
  const q = `
  Select users.id as userId,username,gender,isAdmin,language,SUM(bets.points) AS total_points,month_name,seasons.name as seasonname FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.id=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  JOIN seasons 
  ON gameweeks.seasonId=seasons.id
  WHERE month_name=? AND user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId,month_name
  ORDER BY points DESC;
  `;
  connexion.query(
    `SELECT leagues.id as id,seasons.name as seasonname,leagues.name as name,seasonId,code,leagues.domainId as domainId FROM leagues
    JOIN seasons 
    ON leagues.seasonId=seasons.id
    WHERE leagues.id=?`,
    req.params.leagueId,
    (error, result) => {
      if (!result[0])
        return res.status(400).json({ message: "League not found" });
      if (error) return next(error);
      if (result[0].seasonId != req.params.seasonId)
        return res
          .status(400)
          .json({ message: "Season not found for this league" });
      let league = result[0];
      connexion.query(
        "SELECT * FROM gameweeks WHERE domainId=? AND seasonId=?",
        [league.domainId, req.params.seasonId],
        (error, result) => {
          if (!result[0])
            return res.status(400).json({ message: "Season not found" });
          if (error) return next(error);
          connexion.query(
            `
        SELECT * FROM gameweeks
        JOIN calendar_results
        ON gameweeks.id=gameweekId
        WHERE bingo IS NOT NULL AND month_name=? AND seasonId=? AND domainId=?
        GROUP BY month_name
        `,
            [req.params.month, req.params.seasonId, league.domainId],
            (error, result) => {
              if (!result[0])
                return res.status(400).json({ message: "Month not found" });
              if (error) return next(error);
              connexion.query(
                q,
                [
                  req.params.month,
                  req.params.leagueId,
                  req.params.seasonId,
                  league.domainId,
                ],
                (error, result) => {
                  if (error) return next(error);
                  for (let i = 0; i < result.length; i++) {
                    if (i == 0) {
                      result[i].rank = i + 1;
                    } else {
                      if (
                        result[i].total_points == result[i - 1].total_points
                      ) {
                        result[i].rank = result[i - 1].rank;
                      } else {
                        result[i].rank = i + 1;
                      }
                    }
                  }
                  const rank = result;
                  const qr = `
                   SELECT userId,users.username FROM user_league
                   JOIN users
                   ON userId=users.id
                   WHERE leagueId=${req.params.leagueId}
                   `;
                  connexion.query(qr, (error, result) => {
                    if (error) return next(error);
                    let x = rank.length;
                    for (let i = 0; i < result.length; i++) {
                      const user = rank.filter(
                        (el) => el.userId == result[i].userId
                      );

                      if (!user[0]) {
                        result[i].total_points = 0;
                        result[i].rank = x + 1;
                        result[i].seasonname = league.seasonname;
                        result[i].month = req.params.month;
                        rank.push(result[i]);
                      }
                    }
                    return res
                      .status(200)
                      .json({ message: "Order of users", data: rank });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

//order of users in a specific league  and specific season
router.get("/rank/:leagueId/:seasonId", auth, (req, res, next) => {
  const q = `
  Select users.id as userId,username,gender,isAdmin,language,SUM(bets.points) AS total_points,seasons.name AS seasonname FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.id=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  JOIN seasons
  ON seasons.id=gameweeks.seasonId
  WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId
  ORDER BY total_points DESC;
  `;

  connexion.query(
    "SELECT * FROM leagues WHERE id=?",
    req.params.leagueId,
    (error, result) => {
      if (!result[0])
        return res.status(400).json({ message: "League not found" });
      if (error) return next(error);
      if (result[0].seasonId != req.params.seasonId)
        return res
          .status(400)
          .json({ message: "season not found for this league" });
      let league = result[0];
      connexion.query(
        "SELECT * FROM gameweeks WHERE domainId=? AND seasonId=?",
        [league.domainId, req.params.seasonId],
        (error, result) => {
          if (!result[0])
            return res.status(400).json({ message: "No gameweeks yet" });
          if (error) return next(error);
          connexion.query(
            q,
            [req.params.leagueId, req.params.seasonId, league.domainId],
            (error, result) => {
              if (error) return next(error);
              for (let i = 0; i < result.length; i++) {
                if (i == 0) {
                  result[i].rank = i + 1;
                } else {
                  if (result[i].total_points == result[i - 1].total_points) {
                    result[i].rank = result[i - 1].rank;
                  } else {
                    result[i].rank = i + 1;
                  }
                }
              }
              const rank = result;
              connexion.query(
                `SELECT * FROM calendar_results
              JOIN gameweeks
              ON gameweeks.id=gameweekId
              WHERE bingo IS NOT NULL AND domainId=? AND seasonId=?
              ORDER BY played_on DESC`,
                [league.domainId, league.seasonId],
                (error, result) => {
                  if (error) return next(error);
                  let gameweek = "-";
                  let gameweekId = "";
                  result[0]
                    ? (gameweekId = result[0].gameweekId)
                    : (gameweekId = null);
                  result[0] ? (gameweek = result[0].name) : (gameweek = "-");
                  connexion.query(
                    `
            Select users.id as userId,username,gender,isAdmin,language, bets.points AS GW_points,gameweeks.id AS gameweekId, gameweeks.name FROM bets
            JOIN users
            ON bets.userId=users.id
            JOIN gameweeks
            ON gameweeks.id=bets.gameweekId
            JOIN user_league 
            ON user_league.userId=users.id
            WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=? AND points IS NOT NULL
            ORDER BY gameweeks.id DESC;
            `,
                    [req.params.leagueId, req.params.seasonId, league.domainId],
                    (error, result) => {
                      if (error) return next(error);
                      if (result.length != 0)
                        result = result.filter(
                          (el) => el.gameweekId == gameweekId
                        );
                      for (let i = 0; i < rank.length; i++) {
                        rank[i].GW_points = 0;
                        rank[i].gameweek = gameweek;
                        let userRank = result.filter(
                          (el) => el.userId == rank[i].userId
                        );
                        if (userRank[0])
                          rank[i].GW_points = userRank[0].GW_points;
                      }
                      const qr = `
                Select users.id as userId,username,gender,isAdmin,language,SUM(bets.points) AS total_points FROM bets
                JOIN users
                ON bets.userId=users.id
                JOIN gameweeks
                ON gameweeks.id=bets.gameweekId
                JOIN user_league 
                ON user_league.userId=users.id
                WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=? AND gameweeks.id <> ${gameweekId}
                GROUP BY bets.userId
                ORDER BY total_points DESC;
               `;
                      connexion.query(
                        qr,
                        [
                          req.params.leagueId,
                          req.params.seasonId,
                          league.domainId,
                        ],
                        (error, result) => {
                          if (error) return next(error);
                          for (let i = 0; i < result.length; i++) {
                            if (i == 0) {
                              result[i].rank = i + 1;
                            } else {
                              if (
                                result[i].total_points ==
                                result[i - 1].total_points
                              ) {
                                result[i].rank = result[i - 1].rank;
                              } else {
                                result[i].rank = i + 1;
                              }
                            }
                          }
                          for (let i = 0; i < rank.length; i++) {
                            rank[i].oldRank = "-";
                            let userRank = result.filter(
                              (el) => el.userId == rank[i].userId
                            );
                            if (userRank[0]) rank[i].oldRank = userRank[0].rank;
                          }
                          const qr = `
                 SELECT userId,users.username,gender,isAdmin,language FROM user_league
                 JOIN users
                 ON userId=users.id
                 WHERE leagueId=${req.params.leagueId}
                 `;
                          connexion.query(qr, (error, result) => {
                            if (error) return next(error);
                            let x = rank.length;
                            for (let i = 0; i < result.length; i++) {
                              const user = rank.filter(
                                (el) => el.userId == result[i].userId
                              );

                              if (!user[0]) {
                                result[i].total_points = 0;
                                result[i].rank = x + 1;
                                result[i].GW_points = 0;
                                result[i].gameweek = gameweek;
                                result[i].oldRank = "-";

                                rank.push(result[i]);
                              }
                            }
                            return res
                              .status(200)
                              .json({ message: "order of users", data: rank });
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

//get leagues of logedIn user at specific domain

router.get("/:userId/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT leagues.id as leagueId, leagues.name as name,creatorId, created_at,genreId,leagues.seasonId AS seasonId,date_format(created_at,'%y/%m/%d') as date,
   date_format(created_at,'%H:%i')  as time FROM user_league
  JOIN leagues
     ON leagueId=leagues.id
  JOIN domain_seasonstatus 
     ON domain_seasonstatus.seasonId=leagues.seasonId
  JOIN leagues_genres
     ON leagues_genres.id=leagues.genreId
  WHERE userId=${req.params.userId} AND leagues.domainId=${req.params.domainId} AND domain_seasonstatus.domainId=${req.params.domainId} AND isFinished=0
  `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      if (error) return next(error);

      connexion.query(
        "SELECT * from betfun_domains WHERE id=?",
        req.params.domainId,
        (error, result) => {
          if (!result[0])
            return res.status(400).json({ message: "Domain not found" });
          if (error) return next(error);

          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, req.params.domainId],
            (error, result) => {
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "Bettor not registered in this domain" });
              if (error) return next(error);

              connexion.query(q, (error, results) => {
                if (!results[0])
                  return res.status(400).json({ message: "Leagues not found" });
                if (error) return next(error);

                const leagues = results;
                let qr = "";
                leagues.forEach((league) => {
                  qr += `
                  Select users.id as userId,username,gender,isAdmin,language,SUM(bets.points) AS total_points FROM bets
                  JOIN users
                  ON bets.userId=users.id
                  JOIN gameweeks
                  ON gameweeks.id=bets.gameweekId
                  JOIN user_league 
                  ON user_league.userId=users.id
                  WHERE user_league.leagueId=${league.leagueId} AND gameweeks.seasonId=${league.seasonId} AND gameweeks.domainId=${req.params.domainId}
                  GROUP BY bets.userId
                  ORDER BY total_points DESC;
                `;
                });
                connexion.query(
                  qr + "SELECT * from leagues WHERE genreId=0",
                  (error, result) => {
                    if (!result[0])
                      return res.status(200).json({
                        message: "Leagues with no ranks",
                        data: results,
                      });
                    if (error) return next(error);

                    result.pop();
                    for (let i = 0; i < result.length; i++) {
                      for (let j = 0; j < result[i].length; j++) {
                        if (j == 0) {
                          result[i][j].rank = 1;
                        } else {
                          if (
                            result[i][j].total_points ==
                            result[i][j - 1].total_points
                          ) {
                            result[i][j].rank = result[i][j - 1].rank;
                          } else {
                            result[i][j].rank = j + 1;
                          }
                        }
                      }
                    }
                    let rank = result;
                    connexion.query(
                      `SELECT * FROM calendar_results
                    JOIN gameweeks
                    ON gameweeks.id=gameweekId
                    WHERE bingo IS NOT NULL AND domainId=? AND seasonId=?
                    ORDER BY played_on DESC`,
                      [req.params.domainId, leagues[0].seasonId],
                      (error, result) => {
                        if (error) return next(error);

                        let gameweek = "-";
                        let gameweekId = "";
                        result[0]
                          ? (gameweekId = result[0].gameweekId)
                          : (gameweekId = null);
                        result[0]
                          ? (gameweek = result[0].name)
                          : (gameweek = "-");
                        connexion.query(
                          `
                  SELECT userId,gameweeks.name,gameweekId,points
                  FROM gameweeks
                  JOIN bets
                  ON gameweeks.id=bets.gameweekId
                  WHERE domainId=${req.params.domainId}
                  ORDER BY gameweekId DESC
                  `,
                          (error, result) => {
                            if (error) return next(error);

                            for (let i = 0; i < rank.length; i++) {
                              for (let j = 0; j < rank[i].length; j++) {
                                rank[i][j].GW_points = 0;
                                rank[i][j].gameweek = gameweek;
                                let gmPoint = result.filter(
                                  (el) =>
                                    el.userId == rank[i][j].userId &&
                                    el.gameweekId == gameweekId
                                );
                                if (gmPoint[0])
                                  rank[i][j].GW_points = gmPoint[0].points;
                              }
                            }
                            let ql = "";
                            leagues.forEach((league) => {
                              ql += `
                      Select users.id as userId,username,gender,isAdmin,language,SUM(bets.points) AS total_points FROM bets
                      JOIN users
                      ON bets.userId=users.id
                      JOIN gameweeks
                      ON gameweeks.id=bets.gameweekId
                      JOIN user_league 
                      ON user_league.userId=users.id
                      WHERE user_league.leagueId=${league.leagueId} AND gameweeks.seasonId=${league.seasonId} AND gameweeks.domainId=${req.params.domainId} AND gameweeks.id <> ${gameweekId}
                      GROUP BY bets.userId
                      ORDER BY total_points DESC;
                    `;
                            });
                            connexion.query(
                              ql + "SELECT * from leagues WHERE genreId=0",
                              (error, result) => {
                                if (error) return next(error);

                                result.pop();
                                for (let i = 0; i < result.length; i++) {
                                  for (let j = 0; j < result[i].length; j++) {
                                    if (j == 0) {
                                      result[i][j].rank = 1;
                                    } else {
                                      if (
                                        result[i][j].total_points ==
                                        result[i][j - 1].total_points
                                      ) {
                                        result[i][j].rank =
                                          result[i][j - 1].rank;
                                      } else {
                                        result[i][j].rank = j + 1;
                                      }
                                    }
                                  }
                                }
                                for (let i = 0; i < rank.length; i++) {
                                  for (let j = 0; j < rank[i].length; j++) {
                                    rank[i][j].oldRank = "-";
                                    let oldrank = result[i].filter(
                                      (el) => el.userId == rank[i][j].userId
                                    );
                                    if (oldrank[0])
                                      rank[i][j].oldRank = oldrank[0].rank;
                                  }
                                }
                                for (let i = 0; i < leagues.length; i++) {
                                  leagues[i].userPoint = "-";
                                  leagues[i].userRank = "-";
                                  leagues[i].oldRank = "-";

                                  let userdata = rank[i].filter(
                                    (el) => el.userId == req.params.userId
                                  );
                                  if (userdata[0]) {
                                    leagues[i].userPoint =
                                      userdata[0].total_points;
                                    leagues[i].userRank = userdata[0].rank;
                                    leagues[i].oldRank = userdata[0].oldRank;
                                  }
                                }
                                connexion.query(
                                  `
                      SELECT month_name FROM gameweeks
                      JOIN calendar_results
                      ON gameweeks.id=gameweekId
                      WHERE domainId=${req.params.domainId} AND seasonId=${leagues[0].seasonId} AND bingo IS NOT NULL
                      GROUP BY gameweeks.month_name
                      `,
                                  (error, result) => {
                                    if (error) {
                                      console.log("9");
                                      return next(error);
                                    }
                                    leagues[0].months = result;
                                    return res.status(200).json({
                                      message: "Leagues",
                                      data: leagues,
                                    });
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              });
            }
          );
        }
      );
    }
  );
});

//get code of specific league
router.get("/:leagueId", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM leagues WHERE id=?",
    req.params.leagueId,
    (error, result) => {
      if (!result[0])
        return res.status(400).json({ message: "League not found" });
      if (req.user.id != result[0].creatorId)
        return res.status(403).json({
          message: "Only the creator of this league can get the code",
        });
      if (error) return next(error);
      return res.status(200).json({ message: "code", data: result[0].code });
    }
  );
});

//Admin
//create new country league
router.post("/admin/", [auth, authoriz], (req, res, next) => {
  if (!req.body.countryId)
    return res.status(400).json({ message: "CountryId is required " });
  if (!req.body.domainId)
    return res.status(400).json({ message: "DomainId is required " });
  if (!req.body.seasonId)
    return res.status(400).json({ message: "SeasonId is required " });
  connexion.query(
    "SELECT * FROM countries WHERE id=?",
    req.body.countryId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "country not found" });
      let country = result[0];
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        req.body.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            "SELECT * FROM seasons WHERE id=?",
            req.body.seasonId,
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "season not found" });
              connexion.query(
                "SELECT * FROM leagues WHERE domainId=? AND countryId=?",
                [req.body.domainId, req.body.countryId],
                (error, result) => {
                  if (error) return next(error);
                  if (result[0])
                    return res
                      .status(400)
                      .json({ message: "league already exist" });
                  connexion.query(
                    'SELECT * FROM leagues_genres WHERE name="Global"',
                    (error, result) => {
                      if (error) return next(error);
                      let newLeague = {
                        name: country.name,
                        domainId: req.body.domainId,
                        seasonId: req.body.seasonId,
                        genreId: result[0].id,
                        countryId: req.body.countryId,
                      };
                      connexion.query(
                        "INSERT INTO leagues SET ?",
                        newLeague,
                        (error, result) => {
                          if (error) return next(error);
                          return res
                            .status(200)
                            .json({ message: "league created successfully" });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// update leagues
router.put("/:leagueId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * FROM leagues WHERE id=?",
    req.params.leagueId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "league not found" });
      connexion.query(
        "SELECT * FROM seasons WHERE id=?",
        req.body.seasonId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "season not found" });
          let q = `
          UPDATE leagues SET
          seasonId=${req.body.seasonId}
          WHERE id=${req.params.leagueId}
          `;
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "league updated successfully" });
          });
        }
      );
    }
  );
});

module.exports = router;
