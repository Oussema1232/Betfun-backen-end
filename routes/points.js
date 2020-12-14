const express = require("express");
const updatefunc = require("../querry/updatefunction");
const insertpoints = require("../querry/insertpoints");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/", (req, res, next) => {
  let matchesbingos = req.body.bingos;

  let q = updatefunc(matchesbingos);
  connexion.beginTransaction(function (err) {
    if (err) {
      return next(err);
    }
    connexion.query(q, function (err, results, fields) {
      if (err) {
        return connexion.rollback(function () {
          return next(err);
        });
      }

      let q = `SELECT idBet,
        SUM(CASE
        WHEN (guess=bingo AND guess="1") THEN cote_1
        WHEN (guess=bingo AND guess="2") THEN cote_2
        WHEN (guess=bingo AND guess="x") THEN cote_x
        ELSE 0
        END) AS guesspoints
        FROM betdetails
                JOIN bets
                ON idBet=bets.id
                JOIN calendar_results
                ON idMatch=calendar_results.id
                WHERE gameweekId=${req.body.gameweekId}
                GROUP BY idBet`;

      connexion.query(q, function (err, results, fields) {
        if (err) {
          return connexion.rollback(function () {
            return next(err);
          });
        }
        console.log("this is sparta", results);
        let q = insertpoints(results);
        connexion.query(q, function (err, results, fields) {
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
            res.status(200).send("points inserted successfully");
          });
        });
      });
    });
  });
});

//get all points of a specific user at a specific season and specific domain
router.get("/:userId/:seasonId/:domainId", (req, res, next) => {
  const q = `
    Select userId,username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.seasonId=? AND domainId=?;
    `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
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
                  .json({ message: "user is not registered at this domain" });
              connexion.query(
                "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
                [req.params.seasonId, req.params.domainId],
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res
                      .status(400)
                      .json({ message: "season not found" });
                  connexion.query(
                    q,
                    [
                      req.params.userId,
                      req.params.seasonId,
                      req.params.domainId,
                    ],
                    (error, result) => {
                      if (error) return next(error);
                      if (!result[0].userId)
                        return res.status(200).json({
                          message: "user points",
                          data: {
                            userId: req.params.userId,
                            total_points: 0,
                          },
                        });
                      return res
                        .status(200)
                        .json({ message: "user points", data: result });
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

//get all points of a specific user at a specific gameweek
router.get("/:userId/:gameweekId", (req, res, next) => {
  const q = `
    Select userId,username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.id=?;
    `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE id=?",
        req.params.gameweekId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "gameweek not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, result[0].domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "user is not registered at this domain" });
              connexion.query(
                q,
                [req.params.userId, req.params.gameweekId],
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0].userId)
                    return res.status(200).json({
                      message: "user points",
                      data: { userId: req.params.userId, total_points: 0 },
                    });
                  return res
                    .status(200)
                    .json({ message: "user points", data: result });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
