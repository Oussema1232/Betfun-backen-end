const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

//get all points of a specific user at a specific season
router.get("/points/:id/:season", auth, (req, res, next) => {
  const q = `
    Select username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.season=?;
    `;
  connexion.query(q, [req.params.id, req.params.season], (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//get all points of a specific user at a specific gameweek at a specific season
router.get("/points/:id/:season/:gameweek", auth, (req, res, next) => {
  const q = `
    Select username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.season=? AND gameweeks.gameweek=?;
    `;
  connexion.query(
    q,
    [req.params.id, req.params.season, req.params.gameweek],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//order of users based on points at a specific gameweek at a specific season
router.get("/:season/:gameweek", auth, (req, res, next) => {
  const q = `
        Select username,points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id
        JOIN users
        ON userId=users.id
        WHERE gameweeks.gameweek=? AND gameweeks.season=?
        ORDER BY points DESC;
        `;
  connexion.query(
    q,
    [req.params.gameweek, req.params.season],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//order of users based on total of points at a specific season
router.get("/:season", auth, (req, res, next) => {
  const q = `
        SELECT username,SUM(points) AS total_points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id 
        JOIN users
        ON userId=users.id
        WHERE gameweeks.season=1
        GROUP BY userId
        ORDER BY total_points DESC; 
        `;
  connexion.query(q, req.params.season, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//order of users based on total of points (all season)
router.get("/", auth, (req, res, next) => {
  const q = `
        SELECT username,SUM(points) AS total_points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id 
        JOIN users
        ON userId=users.id
        GROUP BY userId
        ORDER BY total_points DESC; 
        `;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//order of users based on points on specific month at a specific season

router.get("/monthrank/:month/:season", auth, (req, res) => {
  const q = `
        Select username,month_name,SUM(points) AS total_points FROM bets
        JOIN users
        ON userId=users.id
        JOIN gameweeks
        ON gameweeks.gameweek=bets.gameweekId
        WHERE month_name=? AND gameweeks.season=?
        GROUP BY userId,month_name
        ORDER BY points DESC;
        `;
  connexion.query(q, [req.params.month, req.params.season], (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});
module.exports = router;
