const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const router = express.Router();

//get matches season domain special format
router.get("/matches/:seasonId/:domainId",auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
        [req.params.seasonId, req.params.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "gameweeks not found" });

          let q = "";
          let qr = "";
          let gameweeks = result;
          let tab = [];
          for (let i = 0; i < result.length; i++) {
            q += `SELECT date_format(played_on,'%y/%m/%d') as day FROM calendar_results 
              WHERE gameweekId=${result[i].id}
              GROUP BY day
              
              ;`;
            qr += `SELECT 
            CONCAT(teams1.name," vs ",teams2.name) AS matchs,
                        teams1.id as team1Id,
                        teams2.id as team2Id,
                        teams1.name as team1,
                        teams2.name as team2,
                        teams1.logo as team1logo,
                        teams2.logo as team2logo,
                        calendar_results.id as idMatch,
                        cote_1,
                        cote_x,
                        cote_2,
                        bingo,
                        date_format(played_on,'%Y-%m-%d %H:%I:%S') as played_on,
                         
                         date_format(played_on,'%y/%m/%d') as day,
                         date_format(played_on,'%H:%i') as time,
                         gameweeks.name as gameweekname,
                         gameweeks.id as gameweekId,
                         goals1,
                         goals2 
                  FROM calendar_results
                  JOIN teams AS teams1
                  ON teams1.id=team1Id
                  JOIN teams AS teams2
                  ON teams2.id=team2Id
                  JOIN gameweeks 
                  On gameweeks.id=calendar_results.gameweekId
             WHERE gameweekId=${result[i].id}
             ORDER BY played_on ASC;
             `;
          }
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res
                .status(400)
                .json({ message: "There is no matches in this gameweek" });
            let gameweekDays = result;
            connexion.query(qr, (error, result) => {
              if (error) return next(error);
              if (gameweeks.length > 1) {
                for (let i = 0; i < gameweeks.length; i++) {
                  let days = [];
                  for (let j = 0; j < gameweekDays[i].length; j++) {
                    days.push({
                      day: gameweekDays[i][j].day,
                      matches: result[i].filter(
                        (el) => el.day == gameweekDays[i][j].day
                      ),
                    });
                  }
                  tab.push({
                    gameweekId: gameweeks[i].id,
                    gameweekname: gameweeks[i].name,
                    days: days,
                  });
                }
              } else {
                let days = [];
                for (let j = 0; j < gameweekDays.length; j++) {
                  days.push({
                    day: gameweekDays[j].day,
                    matches: result.filter(
                      (el) => el.day == gameweekDays[j].day
                    ),
                  });
                }
                tab.push({
                  gameweekId: gameweeks[0].id,
                  gameweekname: gameweeks[0].name,
                  days: days,
                });
              }

              return res.status(200).json({ message: `matchs `, data: tab });
            });
          });
        }
      );
    }
  );
});
//get matches season domain special format
router.get("/fixtures/:seasonId/:domainId",auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
        [req.params.seasonId, req.params.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "gameweeks not found" });

          let q = "";
          let qr = "";
          let gameweeks = result;
          let tab = [];
          for (let i = 0; i < result.length; i++) {
            q += `SELECT date_format(played_on,'%y/%m/%d') as day FROM calendar_results 
              WHERE gameweekId=${result[i].id} AND bingo is null
              GROUP BY day
              ;`;
            qr += `SELECT 
            CONCAT(teams1.name," vs ",teams2.name) AS matchs,
                        teams1.id as team1Id,
                        teams2.id as team2Id,
                        teams1.name as team1,
                        teams2.name as team2,
                        teams1.logo as team1logo,
                        teams2.logo as team2logo,
                        calendar_results.id as idMatch,
                        bingo,
                         played_on,
                         date_format(played_on,'%y/%m/%d') as day,
                         date_format(played_on,'%H:%i') as time,
                         gameweeks.name as gameweekname,
                         gameweeks.id as gameweekId,
                         goals1,
                         goals2 
                  FROM calendar_results
                  JOIN teams AS teams1
                  ON teams1.id=team1Id
                  JOIN teams AS teams2
                  ON teams2.id=team2Id
                  JOIN gameweeks 
                  On gameweeks.id=calendar_results.gameweekId
             WHERE gameweekId=${result[i].id} AND bingo is null;`;
          }
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res
                .status(400)
                .json({ message: "There is no matches left" });
            let gameweekDays = result;
            connexion.query(qr, (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "there is no fixtures available" });
              if (gameweeks.length > 1) {
                for (let i = 0; i < gameweeks.length; i++) {
                  let days = [];
                  for (let j = 0; j < gameweekDays[i].length; j++) {
                    days.push({
                      day: gameweekDays[i][j].day,
                      matches: result[i].filter(
                        (el) => el.day == gameweekDays[i][j].day
                      ),
                    });
                  }
                  if (days.length >= 1) {
                    tab.push({
                      gameweekId: gameweeks[i].id,
                      gameweekname: gameweeks[i].name,
                      days: days,
                    });
                  }
                }
              } else {
                let days = [];
                for (let j = 0; j < gameweekDays.length; j++) {
                  days.push({
                    day: gameweekDays[j].day,
                    matches: result.filter(
                      (el) => el.day == gameweekDays[j].day
                    ),
                  });
                }
                if (days.length >= 1) {
                  tab.push({
                    gameweekId: gameweeks[0].id,
                    gameweekname: gameweeks[0].name,
                    days: days,
                  });
                }
              }

              return res.status(200).json({ message: `matchs `, data: tab });
            });
          });
        }
      );
    }
  );
});
//get matches gameweek
router.get("/matches/:gameweekId",auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM gameweeks WHERE id=?",
    req.params.gameweekId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "gameweek not found" });

      let tab = [];

      q = `SELECT date_format(played_on,'%y/%m/%d') as day FROM calendar_results 
              WHERE gameweekId=${req.params.gameweekId}
              GROUP BY day
              ;`;
      qr = `SELECT 
            CONCAT(teams1.name," vs ",teams2.name) AS matchs,
                         played_on,
                         calendar_results.id as idMatch,
                         date_format(played_on,'%y/%m/%d') as day,
                         date_format(played_on,'%H:%i') as time,
                         gameweeks.name as gameweekname,
                         gameweeks.id as gameweekId,
                         teams1.id as team1Id,
                        teams2.id as team2Id,
                        teams1.name as team1,
                        teams2.name as team2,
                        teams1.logo as team1logo,
                        teams2.logo as team2logo,
                         cote_1,
                         cote_2,
                         cote_x,
                         goals1,
                         goals2 
                  FROM calendar_results
                  JOIN teams AS teams1
                  ON teams1.id=team1Id
                  JOIN teams AS teams2
                  ON teams2.id=team2Id
                  JOIN gameweeks 
                  On gameweeks.id=calendar_results.gameweekId
             WHERE gameweekId=${req.params.gameweekId};`;

      connexion.query(q, (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res
            .status(400)
            .json({ message: "there is no matches in this gameweek" });
        let gameweekDays = result;
        connexion.query(qr, (error, result) => {
          if (error) return next(error);

          let days = [];
          for (let j = 0; j < gameweekDays.length; j++) {
            days.push({
              day: gameweekDays[j].day,
              matches: result.filter((el) => el.day == gameweekDays[j].day),
            });
          }
          tab.push({
            gameweekId: req.params.gameweekId,
            days: days,
          });

          return res
            .status(200)
            .json({ message: `matchs ${tab[0].days.length}`, data: tab });
        });
      });
    }
  );
});

//get results of specific team
router.get("/teamresults/:teamId", auth, (req, res, next) => {
  const q = `
            SELECT CONCAT(teams1.name," vs ",teams2.name) AS matchs,
                   played_on,
                   cote_1,
                   cote_2,
                   cote_x,
                   goals1,
                   goals2 
            FROM calendar_results
            JOIN teams AS teams1
            ON teams1.id=team1Id
            JOIN teams AS teams2
            ON teams2.id=team2Id
            WHERE (team1Id=${req.params.teamId} OR team2Id=${req.params.teamId}) AND bingo IS NOT NULL;
            `;
  connexion.query(
    "SELECT * FROM teams WHERE id=?",
    req.params.teamId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "team not found", data: result });
      connexion.query(q, (error, result) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ message: "result of team", data: result });
      });
    }
  );
});

//get fixtures of specific team
router.get("/teamfixtures/:teamId", auth, (req, res) => {
  const q = `
            SELECT CONCAT(teams1.name," vs ",teams2.name) AS matchs,
                   played_on,
                   cote_1,
                   cote_2,
                   cote_x
            FROM calendar_results
            JOIN teams AS teams1
            ON teams1.id=team1Id
            JOIN teams AS teams2
            ON teams2.id=team2Id
            WHERE (team1Id=${req.params.id} OR team2Id=${req.params.id}) AND bingo IS NULL;
            `;
  connexion.query(
    "SELECT * FROM teams WHERE id=?",
    req.params.teamId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "team not found", data: result });
      connexion.query(q, (error, result) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ message: "result of team", data: result });
      });
    }
  );
});

//admin
//add new match
router.post(
  "/"
  ,[auth,authoriz],
  (req, res, next) => {
    if (!req.body.team1Id)
      return res.status(400).json({ message: "team1Id is required" });
    if (!req.body.team2Id)
      return res.status(400).json({ message: "team2Id is required" });
    if (req.body.team2Id == req.body.team1Id)
      return res.status(400).json({ message: "teams should be different" });

    if (!req.body.gameweekId)
      return res.status(400).json({ message: "gameweekId is required" });
    if (!req.body.played_on)
      return res.status(400).json({ message: "played_on is required" });
    if (!req.body.cote_1)
      return res.status(400).json({ message: "cote_1 is required" });
    if (!req.body.cote_2)
      return res.status(400).json({ message: "cote_2 is required" });
    if (!req.body.cote_x)
      return res.status(400).json({ message: "cote_x is required" });
    connexion.query(
      "SELECT * FROM gameweeks WHERE id=?",
      req.body.gameweekId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "gameweek not found" });
        let gameweek = result[0];
        connexion.query(
          "SELECT * FROM teams WHERE id=?",
          req.body.team1Id,
          (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res.status(400).json({ message: "team1 not found" });
            if (result[0].domainId != gameweek.domainId)
              return res
                .status(400)
                .json({ message: "invalid domain for team1" });
            connexion.query(
              "SELECT * FROM teams WHERE id=?",
              req.body.team2Id,
              (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res.status(400).json({ message: "team2 not found" });
                if (result[0].domainId != gameweek.domainId)
                  return res
                    .status(400)
                    .json({ message: "invalid domain for team2" });
                let match = {
                  team1Id: req.body.team1Id,
                  team2Id: req.body.team2Id,
                  gameweekId: req.body.gameweekId,
                  played_on: req.body.played_on,
                  cote_1: req.body.cote_1,
                  cote_2: req.body.cote_2,
                  cote_x: req.body.cote_x,
                };
                connexion.query(
                  "INSERT INTO calendar_results SET ?",
                  match,
                  (error, result) => {
                    if (error) return next(error);
                    return res
                      .status(200)
                      .json({ message: "match created successfully" });
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

//update match
router.put(
  "/:matchId"
  ,[auth,authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM calendar_results WHERE id=?",
      req.params.matchId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "match not found" });
        if (req.body.goals1 && req.body.goals2) {
        }
        let match = result[0];
        let team1Id = req.body.team1Id || match.team1Id;
        let team2Id = req.body.team2Id || match.team2Id;
        let gameweekId = req.body.gameweekId || match.gameweekId;
        let played_on = req.body.played_on || match.played_on;
        let cote_1 = req.body.cote_1 || match.cote_1;
        let cote_2 = req.body.cote_2 || match.cote_2;
        let cote_x = req.body.cote_x || match.cote_x;
        let bingo = req.body.bingo || match.bingo;
        let goals1 = req.body.goals1 || match.goals1;
        let goals2 = req.body.goals2 || match.goals2;
        connexion.query(
          "SELECT * FROM gameweeks WHERE id=?",
          gameweekId,
          (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res.status(400).json({ message: "gameweek not found" });
            let gameweek = result[0];
            connexion.query(
              "SELECT * FROM teams WHERE id=?",
              team1Id,
              (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res.status(400).json({ message: "team1 not found" });
                if (result[0].domainId != gameweek.domainId)
                  return res
                    .status(400)
                    .json({ message: "invalid domain for team1" });
                connexion.query(
                  "SELECT * FROM teams WHERE id=?",
                  team2Id,
                  (error, result) => {
                    if (error) return next(error);
                    if (!result[0])
                      return res
                        .status(400)
                        .json({ message: "team2 not found" });
                    if (result[0].domainId != gameweek.domainId)
                      return res
                        .status(400)
                        .json({ message: "invalid domain for team2" });
                    let q = `
                  UPDATE calendar_results SET
                  team1Id=${team1Id},
                  team2Id=${team2Id},
                  gameweekId=${gameweekId},
                  played_on="${played_on}",
                  cote_1=${cote_1},
                  cote_2=${cote_2},
                  cote_x=${cote_x},
                  bingo=${bingo ? `"${bingo}"` : null},
                  goals1=${goals1},
                  goals2=${goals2}
                  WHERE id=${req.params.matchId}
                  `;
                    connexion.query(q, (error, result) => {
                      if (error) return next(error);
                      return res
                        .status(200)
                        .json({ message: "match updated successfully" });
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

//delete match
router.delete(
  "/:matchId"
  ,[auth,authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM calendar_results WHERE id=?",
      req.params.matchId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "match not found" });
        connexion.query(
          "DELETE FROM calendar_results WHERE id=?",
          req.params.matchId,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "match deleted successfully" });
          }
        );
      }
    );
  }
);

module.exports = router;
