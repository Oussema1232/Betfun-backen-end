const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

//get gameweeks of specific domains
router.get("/:domainId", (req, res, next) => {
  const q = `
  SELECT * FROM gameweeks 
  join seasons on seasonId=seasons.id
  WHERE domainId=?
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(q, req.params.domainId, (error, results) => {
        if (error) return next(error);
        return res.status(200).json({ message: "gameweeks", data: results });
      });
    }
  );
});

//get matches season domain special format
router.get("/matches/:seasonId/:domainId", (req, res, next) => {
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
             WHERE gameweekId=${result[i].id};`;
          }
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res
                .status(400)
                .json({ message: "there is no matches in this gameweek" });
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
router.get("/fixtures/:seasonId/:domainId", (req, res, next) => {
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
                .json({ message: "there is no matches in this gameweek" });
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
router.get("/matches/:gameweekId", (req, res, next) => {
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

module.exports = router;
