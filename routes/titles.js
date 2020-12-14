const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

//get king of country at specific domain at specific season

router.get("/king/:countryId/:seasonId/:domainId", (req, res, next) => {
  const q = `
  SELECT username,
           SUM(points) AS total_points,
           countries.name as country,
           betfun_domains.domainname as domain,
           seasons.name as season FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id 
    JOIN users
    ON userId=users.id
    JOIN countries
    ON users.countryId=countries.id
    join betfun_domains
    ON betfun_domains.id=gameweeks.domainId
    JOIN seasons
    ON seasons.id=gameweeks.seasonId
    WHERE users.countryId=? AND gameweeks.seasonId=? AND gameweeks.domainId=? 
    GROUP BY userId
    ORDER BY total_points DESC
    LIMIT 1
  `;
  connexion.query(
    `SELECT * FROM countries WHERE id=?`,
    req.params.countryId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "country not found" });
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
            [req.params.seasonId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "season not found" });
              connexion.query(
                `
        SELECT * FROM user_domains 
        JOIN users
        ON users.id=user_domains.userId
        WHERE countryId=? AND domainId=?
        `,
                [req.params.countryId, req.params.domainId],
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res.status(400).json({ message: "users not found" });
                  connexion.query(
                    q,
                    [
                      req.params.countryId,
                      req.params.seasonId,
                      req.params.domainId,
                    ],
                    (error, result) => {
                      if (error) return next(error);
                      if (!result[0])
                        return res
                          .status(400)
                          .json({ message: "season has not started" });
                      if (result[0].points == 0)
                        return res(200).json({
                          message: "season has not started",
                        });
                      return res.status(200).json({
                        message: `king of ${result[0].country}`,
                        data: result,
                      });
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

//get kings at specific domain and specific season
router.get("/kings/:domainId", (req, res) => {
  const q = `
  SELECT * from (
    SELECT username,
           SUM(points) AS total_points,
           countries.name as country,
           betfun_domains.domainname as domain,
           seasons.name as season FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id 
    JOIN users
    ON userId=users.id
    JOIN countries
    ON users.countryId=countries.id
    join betfun_domains
    ON betfun_domains.id=gameweeks.domainId
    JOIN seasons
    ON seasons.id=gameweeks.seasonId
     gameweeks.domainId=?
    GROUP BY userId
    ORDER BY total_points DESC
  ) user_rank 
  GROUP BY country
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
        [req.params.seasonId, req.params.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "season not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE domainId=?",
            req.params.domainId,
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "users not found" });
              connexion.query(q, req.params.domainId, (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res
                    .status(400)
                    .json({ message: "season has not started" });
                if (result[0].points == 0)
                  return res(200).json({ message: "season has not started" });
                return res.status(200).json({ message: "kings", data: result });
              });
            }
          );
        }
      );
    }
  );
});

//get sultan of the world
router.get("/sultan/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT username,
           SUM(points) AS total_points,
           countries.name as country,
           betfun_domains.domainname  as domain,
           seasons.name as season FROM bets
    JOIN gameweeks 
    ON gameweekId=gameweeks.id 
    JOIN users
    ON userId=users.id
    JOIN countries
    ON users.countryId=countries.id
    join betfun_domains
    ON betfun_domains.id=gameweeks.domainId
    JOIN seasons
    ON seasons.id=gameweeks.seasonId
    WHERE  gameweeks.domainId=?
    GROUP BY userId
    ORDER BY total_points DESC
    LIMIT 1
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "season not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE domainId=?",
            req.params.domainId,
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "users not found" });
              connexion.query(
                q,
                [req.params.seasonId, req.params.domainId],
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res
                      .status(400)
                      .json({ message: "season has not started" });
                  if (result[0].points == 0)
                    return res(200).json({ message: "season has not started" });
                  return res
                    .status(200)
                    .json({ message: "sultan", data: result });
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
