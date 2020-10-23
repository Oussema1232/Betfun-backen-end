const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

//get matches of specific gameweek
router.get("/gameweekmatches/:id", auth, (req, res, next) => {
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
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//get results of specific team
router.get("/teamresults/:id", auth, (req, res, next) => {
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
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//get fixtures of specific team
router.get("/teamfixtures/:id", auth, (req, res) => {
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
            WHERE team1Id=${req.params.id} OR team2Id=${req.params.id} AND bingo IS NULL;
            `;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

module.exports = router;
