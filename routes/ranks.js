const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

//get all points of a specific user at a specific season and specific domain
router.get("/points/:id/:seasonId/:domainId", auth, (req, res, next) => {
  const q = `
    Select username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.seasonId=? AND domainId=?;
    `;
  connexion.query(
    q,
    [req.params.id, req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//get all points of a specific user at a specific gameweek
router.get("/points/:id/:gameweekId", auth, (req, res, next) => {
  const q = `
    Select username,SUM(points) AS total_points FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id
    JOIN users
    ON userId=users.id
    WHERE userId=? AND gameweeks.id=?;
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

//order of users based on points at a specific gameweek at a specific season and specific domain
router.get("/order/:seasonId/:gameweek/:domainId", auth, (req, res, next) => {
  const q = `
        Select username,points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id
        JOIN users
        ON userId=users.id
        WHERE gameweeks.gameweek=? AND gameweeks.seasonId=? AND domainId=?
        ORDER BY points DESC;
        `;
  connexion.query(
    q,
    [req.params.gameweek, req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//order of users based on total of points at a specific season and specific domain
router.get("/order/:seasonId/:domainId", (req, res, next) => {
  const q = `
        SELECT username,SUM(points) AS total_points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id 
        JOIN users
        ON userId=users.id
        WHERE gameweeks.seasonId=? AND gameweeks.domainId=?
        GROUP BY userId
        ORDER BY total_points DESC; 
        `;
  connexion.query(
    q,
    [req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).send(result);
    }
  );
});

//order of users based on total of points at specific domain (all season)
router.get("/order/:domainId", auth, (req, res, next) => {
  const q = `
        SELECT username,SUM(points) AS total_points FROM bets
        JOIN gameweeks 
        ON gameweekId=gameweeks.id 
        JOIN users
        ON userId=users.id
        WHERE domainId=?
        GROUP BY userId
        ORDER BY total_points DESC; 
        `;
  connexion.query(q, req.params.domainId, (error, result) => {
    if (error) return next(error);
    return res.status(200).send(result);
  });
});

//order of users based on points on specific month at a specific season at specific domain

router.get("/monthrank/:month/:seasonId/:domainId", auth, (req, res) => {
  const q = `
        Select username,month_name,SUM(points) AS total_points FROM bets
        JOIN users
        ON userId=users.id
        JOIN gameweeks
        ON gameweeks.gameweek=bets.gameweekId
        WHERE month_name=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
        GROUP BY userId,month_name
        ORDER BY points DESC;
        `;
  connexion.query(
    q,
    [req.params.month, req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      //return res.status(200).send(result);
      return res.status(200).send("bnj");
    }
  );
});
module.exports = router;
