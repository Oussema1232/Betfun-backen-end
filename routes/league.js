const express = require("express");

const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const nanoid = require("nanoid").nanoid;

const router = express.Router();

//create league
//transaction
router.post("/", (req, res, next) => {
  // if (req.body.userId != req.user.id)
  //   return res.status(403).json({ message: "Access forbidden" });
  if (!req.body.name) return res.status(400).send("must insert league name");
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.body.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(
        "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
        [req.body.userId, req.body.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res
              .status(400)
              .json({ message: "user is not registered at this domain" });
          const code = nanoid(8);
          let newLeague = {
            name: req.body.name,
            code: code,
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
                        message: "league created successfully",
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
router.post("/join", (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  connexion.query(
    `SELECT * FROM leagues WHERE code=?`,
    req.body.code,
    function (err, results) {
      if (err) return next(err);
      let leagueresult = results[0];
      if (!leagueresult)
        return res
          .status(400)
          .json({ message: "No league found under this code" });

      connexion.query(
        `SELECT * FROM user_league WHERE userId=? AND leagueId=?`,
        [req.body.userId, leagueresult.id],
        function (err, results) {
          if (err) next(err);
          if (results[0])
            return res
              .status(400)
              .json({ message: "you are already registred in this league" });
          connexion.query(
            `
          SELECT * FROM user_domains
          JOIN betfun_domains
          ON betfun_domains.id=domainId
          WHERE userId=? AND domainId=?
          `,
            [req.body.userId, leagueresult.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "user not registered in this domain" });
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

router.delete("/", (req, res) => {
  connexion.query("DELETE FROM leagues", function (err, results) {
    if (err) return next(err);
    if (results) return res.status(200).send(`leagues table deleted`);
  });
});

//order of users in a specific league (and specific month) and specific season
router.get("/rank/:leagueId/:seasonId/:month", (req, res, next) => {
  const q = `
  Select users.id as userId,username,month_name,SUM(points) AS total_points FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.id=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  WHERE month_name=? AND user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId,month_name
  ORDER BY points DESC;
  `;
  connexion.query(
    "SELECT * FROM leagues WHERE id=?",
    req.params.leagueId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "league not found" });
      let league = result[0];
      connexion.query(
        "SELECT * FROM gameweeks WHERE domainId=? AND seasonId=?",
        [league.domainId, req.params.seasonId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "season not found" });
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
                if (
                  i != 0 &&
                  result[i].total_points == result[i - 1].total_points
                ) {
                  result[i].rank = i;
                } else {
                  result[i].rank = i + 1;
                }
              }
              return res
                .status(200)
                .json({ message: "order of users", data: result });
            }
          );
        }
      );
    }
  );
});

//order of users in a specific league  and specific season
router.get("/rank/:leagueId/:seasonId", (req, res, next) => {
  const q = `
  Select users.id as userId,username,SUM(bets.points) AS total_points,seasons.name as seasonname FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.id=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  JOIN leagues 
  ON user_league.leagueId=leagues.id
  JOIN seasons 
  ON seasons.id=leagues.seasonId
  WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId
  ORDER BY total_points DESC;
  `;

  connexion.query(
    "SELECT * FROM leagues WHERE id=? AND seasonId=?",
    [req.params.leagueId, req.params.seasonId],
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "league not found" });
      let league = result[0];
      connexion.query(
        "SELECT * FROM gameweeks WHERE domainId=? AND seasonId=?",
        [league.domainId, req.params.seasonId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "season not found" });
          connexion.query(
            q,
            [req.params.leagueId, req.params.seasonId, league.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "this league is empty" });
              if (
                result[0].total_points == 0 ||
                result[0].total_points == null
              ) {
                for (let i = 0; i < result.length; i++) {
                  result[i].rank = "-";
                }
              } else {
                for (let i = 0; i < result.length; i++) {
                  if (
                    i != 0 &&
                    result[i].total_points == result[i - 1].total_points
                  ) {
                    result[i].rank = i;
                  } else {
                    result[i].rank = i + 1;
                  }
                }
              }
              const rank = result;

              connexion.query(
                `
            Select users.id as userId,username, bets.points AS GW_points,gameweeks.id AS gameweekId, gameweeks.name as gameweekname FROM bets
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
                  result = result.filter(
                    (el) => el.gameweekname == result[0].gameweekname
                  );
                  for (let i = 0; i < rank.length; i++) {
                    rank[i].GW_points = 0;
                    rank[i].gameweekname = result[0].gameweekname;
                    let userRank = result.filter(
                      (el) => el.userId == rank[i].userId
                    );
                    if (userRank[0]) rank[i].GW_points = userRank[0].GW_points;
                  }
                  const qr = `
                Select users.id as userId,username,SUM(bets.points) AS total_points,gameweeks.name as gameweekname FROM bets
                JOIN users
                ON bets.userId=users.id
                JOIN gameweeks
                ON gameweeks.id=bets.gameweekId
                JOIN user_league 
                ON user_league.userId=users.id
                WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=? AND gameweeks.id <> ${result[0].gameweekId}
                GROUP BY bets.userId
                ORDER BY total_points DESC;
               `;
                  connexion.query(
                    qr,
                    [req.params.leagueId, req.params.seasonId, league.domainId],
                    (error, result) => {
                      for (let i = 0; i < result.length; i++) {
                        if (
                          i != 0 &&
                          result[i].total_points == result[i - 1].total_points
                        ) {
                          result[i].rank = i;
                        } else {
                          result[i].rank = i + 1;
                        }
                      }
                      for (let i = 0; i < rank.length; i++) {
                        rank[i].oldRank = "-";
                        let userRank = result.filter(
                          (el) => el.userId == rank[i].userId
                        );
                        if (userRank[0]) rank[i].oldRank = userRank[0].rank;
                      }
                      return res
                        .status(200)
                        .json({ message: "order of users", data: rank });
                    }
                  );
                  //return res.status(200).json({message:'order of users',data:rank});
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

router.get("/:userId/:domainId", (req, res, next) => {
  const q = `
  SELECT leagues.id as leagueId, leagues.name as name, created_at,genreId,seasonId,date_format(created_at,'%y/%m/%d') as date,
  date_format(created_at,'%H:%i')  as time FROM user_league
  JOIN leagues
     ON leagueId=leagues.id
  JOIN leagues_genres
     ON leagues_genres.id=leagues.genreId
  WHERE userId=? AND domainId=?
  `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      connexion.query(
        "SELECT * from betfun_domains WHERE id=?",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "user not registered in this domain" });
              connexion.query(
                q,
                [req.params.userId, req.params.domainId],
                (error, results) => {
                  if (error) return next(error);
                  if (!results[0])
                    return res
                      .status(200)
                      .json({ message: "leagues not found" });
                  const leagues = results;
                  let qr = "";
                  leagues.forEach((league) => {
                    qr += `
                  Select users.id as userId,username,SUM(bets.points) AS total_points FROM bets
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
                    qr + "SELECT 1 WHERE 1=2",
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
                              result[i][j].rank = result[i][j - 1].rank;
                            } else {
                              result[i][j].rank = j + 1;
                            }
                          }
                        }
                      }
                      let rank = result;
                      connexion.query(
                        `
                  SELECT userId,gameweeks.name AS gameweek,gameweekId,points
                  FROM gameweeks
                  JOIN bets
                  ON gameweeks.id=bets.gameweekId
                  WHERE gameweeks.domainId=${req.params.domainId}
                  ORDER BY gameweekId DESC
                  `,
                        (error, result) => {
                          if (error) return next(error);
                          for (let i = 0; i < rank.length; i++) {
                            for (let j = 0; j < rank[i].length; j++) {
                              rank[i][j].GW_points = 0;
                              rank[i][j].gameweek = result[0].gameweek;
                              let gmPoint = result.filter(
                                (el) => el.userId == rank[i][j].userId
                              );
                              if (gmPoint[0])
                                rank[i][j].GW_points = gmPoint[0].points;
                            }
                          }
                          let ql = "";
                          leagues.forEach((league) => {
                            ql += `
                      Select users.id as userId,username,SUM(bets.points) AS total_points FROM bets
                      JOIN users
                      ON bets.userId=users.id
                      JOIN gameweeks
                      ON gameweeks.id=bets.gameweekId
                      JOIN user_league 
                      ON user_league.userId=users.id
                      WHERE user_league.leagueId=${league.leagueId} AND gameweeks.seasonId=${league.seasonId} AND gameweeks.domainId=${req.params.domainId} AND gameweeks.id <> ${result[0].gameweekId}
                      GROUP BY bets.userId
                      ORDER BY total_points DESC;
                    `;
                          });
                          connexion.query(
                            ql + "SELECT 1 WHERE 1=2",
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
                                      result[i][j].rank = result[i][j - 1].rank;
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
                                leagues[i].rank = rank[i];
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
                              return res
                                .status(200)
                                .json({ message: "leagues", data: leagues });
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
    }
  );
});

//get code of specific league
router.get("/:leagueId", (req, res, next) => {
  connexion.query(
    "SELECT * FROM leagues WHERE id=?",
    req.params.leagueId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "league not found" });
      if (req.user.id != result[0].creatorId)
        return res.status(403).json({ message: "Access forbidden" });
      res.status(200).json({ messge: "code", data: result[0].code });
    }
  );
});

module.exports = router;
