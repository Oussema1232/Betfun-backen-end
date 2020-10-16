const express = require("express");
const connexion = require("../startup/database");
const router = express.Router();

//get results of specific team
router.get("/:id", (req, res) => {
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
          WHERE team1Id=${req.params.id} OR team2Id=${req.params.id} AND bingo IS NOT NULL;
          `;
  connexion.query(q, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
});

module.exports = router;
