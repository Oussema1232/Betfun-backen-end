const express = require("express");
const connexion = require("../startup/database");
const updatebetdetails = require("../querry/updatebetdetails");
const auth = require("../middleware/auth");
const router = express.Router();

//get all details of a specific bet
router.get("/:betId",auth, (req, res, next) => {
  const q = `
  SELECT teams1.name AS team1,teams2.name AS team2,teams1.logo as team1logo,teams2.logo as team2logo, guess,bingo,cote_x,cote_1,cote_2,goals1,goals2,CONCAT(goals1,"-",goals2) AS score,played_on,date_format(played_on,'%y/%m/%d') as day,
  date_format(played_on,'%H:%i') as time,idBet,idMatch,gameweeks.name as gameweekname FROM betdetails
  JOIN calendar_results
  ON idMatch=calendar_results.id
  JOIN teams AS teams1
  ON teams1.id=team1Id
  JOIN teams AS teams2
  ON teams2.id=team2Id
  JOIN gameweeks
  ON gameweeks.id=gameweekId
  WHERE idBet=?;
  `;
  connexion.query(
    "SELECT * FROM bets WHERE id=?",
    req.params.betId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0]) return res.status(400).json({ message: "bet not found" });
      connexion.query(q, req.params.betId, (error, result) => {
        if (error) return next(error);
        return res.status(200).json({ message: "bet details", data: result });
      });
    }
  );
});
//update bet

router.put("/:betId",auth, (req, res, next) => {
  let q = updatebetdetails(req.body.betdetails, req.params.betId);
  connexion.query(
    "SELECT * FROM bets WHERE id=?",
    req.params.betId,
    (err, result) => {
      if (err) {
        return next(err);
      }
      if (!result[0]) return res.status(400).json({ message: "bet not found" });
      if (result[0].userId != req.user.id)
        return res.status(403).json({ message: "Access forbidden" });
      connexion.query(q, (err, result) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({ message: "guess updated successfully" });
      });
    }
  );
});



module.exports = router;
