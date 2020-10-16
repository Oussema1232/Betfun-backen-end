const express = require("express");
const connexion = require("../startup/database");
const router = express.Router();

//get matches of specific gameweek
router.get("/:id", (req, res) => {
  const q = `
    SELECT (calendar_results.id,
           teams1.name AS team1,
           teams2.name AS team2,
           played_on,
           cote_1,
           cote_2,
           cote_x )
    FROM calendar_results
    JOIN teams AS teams1
    ON teams1.id=team1Id
    JOIN teams AS teams2
    ON teams2.id=team2Id
    WHERE gameweekId=?
    `;
  connexion.query(q, req.params.id, (error, result) => {
    if (error) return res.status(500).json({ error });
    return res.status(200).json(result);
  });
});

module.exports = router;
