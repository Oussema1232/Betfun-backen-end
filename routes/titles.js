const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

//get king of country at specific domain at specific season
//i did not use it because i filtered countries with front end

router.get("/king/:countryId/:seasonId/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT username,
           SUM(points) AS total_points,
           countries.name as country,
           betfun_domains.name as domain,
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

//get sultan of the world
//i did not use it because i took first one of kings
router.get("/sultan/:seasonId/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT username,
           SUM(points) AS total_points,
           countries.name as country,
           betfun_domains.name as domain,
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
    WHERE gameweeks.seasonId=? AND gameweeks.domainId=?
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

//get kings at specific domain and specific season
router.get("/kings/:seasonId/:domainId", (req, res, next) => {
  const seasonkings = (x) => {
    return `
  SELECT * from (
    SELECT bets.userId as userId,
         username,
         SUM(points) AS total_points,
         countries.name as countryname,
         countries.id as countryId,
         betfun_domains.domainname as domainname,
         seasons.name as seasonname ,
         seasons.id as seasonId
  FROM bets 
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
    WHERE gameweeks.seasonId=${x} AND gameweeks.domainId=${req.params.domainId}
    GROUP BY userId
    ORDER BY total_points DESC
  ) user_rank 
  GROUP BY countryname;
  `;
  };
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
              connexion.query(
                seasonkings(req.params.seasonId),
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res.status(400).json({ message: "no bets" });
                  connexion.query(
                    `
        SELECT * FROM seasons
        JOIN gameweeks 
        ON seasons.id=gameweeks.seasonId
        WHERE domainId=?
        GROUP BY seasonId
        `,
                    req.params.domainId,
                    (error, result) => {
                      if (error) return next(error);
                      if (!result[0])
                        return res
                          .status(400)
                          .json({ message: "season not found" });
                      let q = "";
                      for (let i = 0; i < result.length; i++) {
                        q += seasonkings(result[i].seasonId);
                      }

                      connexion.query(
                        q + "SELECT 1 WHERE 1=0",
                        (error, result) => {
                          if (error) return next(error);
                          if (!result[0])
                            return res
                              .status(400)
                              .json({ message: "season not found" });
                          result = result.filter((el) => el.length != 0);

                          const kings = result.filter(
                            (el) => el[0].seasonId == req.params.seasonId
                          );
                          kings[0] = kings[0].filter(
                            (el) =>
                              el.total_points != null && el.total_points != 0
                          );
                          if (kings[0].length == 0)
                            return res
                              .status(400)
                              .json({ message: "season has not started" });
                          for (let i = 0; i < kings[0].length; i++) {
                            kings[0][i].NTKing = 0;
                            kings[0][i].NTSultan = 0;
                            for (let j = 0; j < result.length; j++) {
                              if (
                                result[j][0].userId == kings[0][i].userId &&
                                result[j][0].total_points != null &&
                                result[j][0].total_points != 0
                              )
                                kings[0][i].NTSultan += 1;
                              let x = result[j].filter(
                                (el) =>
                                  el.userId == kings[0][i].userId &&
                                  el.total_points != null &&
                                  el.total_points != 0
                              );
                              if (x.length != 0) kings[0][i].NTKing += 1;
                            }
                          }

                          return res
                            .status(200)
                            .json({ message: "kings", data: kings[0] });
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
    }
  );
});

module.exports = router;
