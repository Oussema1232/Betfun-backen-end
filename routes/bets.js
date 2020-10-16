const express = require("express");
const connexion = require("../startup/database");

const router = express.Router();

//create new bet
router.post("/", (req, res) => {
  connexion.query(
    "SELECT * FROM bets WHERE userId=? AND gameweekId=?",
    [req.body.userId, req.body.gameweekId],
    (error, result) => {
      if (error) return res.status(500).json(error);
      if (result[0])
        return res.status(400).json({ message: "bet already created" });
      connexion.query(
        "INSERT INTO bets SET ?",
        [req.body.userId, req.body.gameweekId],
        (err, resultat) => {
          if (err) return res.status(500).json(err);
          let betDetails = req.body.betDetails;
          for (let i = 0; i < length(betDetails); i++) {
            betDetails[i] = betDetails[i].push(resultat.insertId);
          }
          let sql = `INSERT INTO betdetails (idMatch, guess, idBet) VALUES ?`;
          connexion.query(sql, [betDetails], (erreur, reslt) => {
            if (erreur) {
              connexion.query("DELETE FROM bets WHERE id=?", result.insertId);
              return res.status(500).json(erreur);
            }
            return res.status(201);
          });
        }
      );
    }
  );
});

//update bet

router.put("/:id", (req, res) => {
  connexion.query(
    "SELECT * FROM bets WHERE id=",
    req.params.id,
    (error, result) => {
      if (error) return res.status(500).json(error);
      let sql = `
          UPDATE TABLE betdetails
          SET guess=?
          WHERE idMatch=? AND idBet=${req.params.id};
          `;
      connexion.query(sql, [req.body.betDetails], (error, result) => {
        if (error) return res.status(500).json(error);
        res.status(201);
      });
    }
  );
});

module.exports = router;
