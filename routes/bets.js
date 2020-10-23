const express = require("express");
const connexion = require("../startup/database");
const updatebetdetails = require("../querry/updatebetdetails");
const auth = require("../middleware/auth");
const router = express.Router();

//create bet
router.post("/", auth, (req, res, next) => {
  connexion.beginTransaction(function (err) {
    if (err) {
      return next(err);
    }
    connexion.query(
      "SELECT * FROM bets WHERE userId=? AND gameweekId=?",
      [req.body.userId, req.body.gameweekId],
      (err, result) => {
        if (err) {
          return connexion.rollback(function () {
            return next(err);
          });
        }

        if (result[0]) return res.status(400).send("bet already created");
        connexion.query(
          "INSERT INTO bets SET ?",
          { userId: req.body.userId, gameweek: req.body.gameweekId },
          (err, resultat) => {
            if (err) {
              return connexion.rollback(function () {
                return next(err);
              });
            }

            let betDetails = req.body.betdetails;

            for (let i = 0; i < betDetails.length; i++) {
              betDetails[i].push(resultat.insertId);
            }

            let sql = `INSERT INTO betdetails (idMatch, guess, idBet) VALUES ?`;
            connexion.query(sql, [betDetails], (err, result) => {
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
                res.status(200).send("bet created successfully");
              });
            });
          }
        );
      }
    );
  });
});

//update bet

router.put("/:id", auth, (req, res, next) => {
  let q = updatebetdetails(req.body.betdetails, req.params.id);
  connexion.query(
    "SELECT * FROM bets WHERE id=?",
    req.params.id,
    (err, result) => {
      if (err) {
        return next(err);
      }
      connexion.query(q, (err, result) => {
        if (err) {
          return next(err);
        }
        res.status(200).send("guess updated successfully");
      });
    }
  );
});

//get bets of a specific user at a specefic season
router.get("/:id/:season", auth, (req, res) => {
  const q = `
  SELECT * FROM bets 
  JOIN gameweeks 
  ON gameweekId=gameweeks.id
  WHERE userId=? AND gameweeks.season=?;
  `;
  connexion.query(q, [req.params.id, req.params.season], (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//get bets of a specific user at a specific gameweek at a specific season
router.get("/:id/:season/:gameweek", auth, (req, res) => {
  const q = `
      SELECT * FROM bets 
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      WHERE userId=? AND gameweeks.gameweek=? AND gameweeks.season=?;
      `;
  connexion.query(
    q,
    [req.params.id, req.params.gameweek, req.params.season],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//get bets of specific user (all season)
router.get("/:id", auth, (req, res) => {
  const q = `
      SELECT * FROM bets
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweekId
      WHERE userId=? ;
      `;
  connexion.query(q, req.params.id, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//get all details of a specific bet
router.get("/betdetails/:id", auth, (req, res) => {
  const q = `
  SELECT teams1.name AS team1,teams2.name AS team2,guess,bingo FROM betdetails
  JOIN calendar_results
  ON idMatch=calendar_results.id
  JOIN teams AS teams1
  ON teams1.id=team1Id
  JOIN teams AS teams2
  ON teams2.id=team2Id
  WHERE idBet=?;
  `;
  connexion.query(q, req.params.id, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

module.exports = router;
