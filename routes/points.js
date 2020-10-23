const express = require("express");
const updatefunc = require("../querry/updatefunction");
const insertpoints = require("../querry/insertpoints");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/",auth, (req, res, next) => {
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

module.exports = router;
