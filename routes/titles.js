const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const _ = require("lodash");
const router = express.Router();

//get kings at specific domain and specific season
router.get("/kings/:seasonId/:domainId", auth, (req, res, next) => {
  const seasonkings = (x) => {
    return `
  SELECT * from (
    SELECT bets.userId as userId,
         username,
         gender,
         SUM(points) AS total_points,
         countries.id as countryId,
         countries.name as countryname,
         countries.logo as countrylogo,
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
        return res.status(400).json({ message: "Domain not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE seasonId=? AND domainId=?",
        [req.params.seasonId, req.params.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "Season not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE domainId=?",
            req.params.domainId,
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "Bettors not found" });
              connexion.query(
                seasonkings(req.params.seasonId),
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res.status(400).json({ message: "No Bets played" });
                  connexion.query(
                    `
        SELECT * FROM seasons
        JOIN domain_seasonstatus
        ON seasons.id=domain_seasonstatus.seasonId
        JOIN gameweeks 
        ON seasons.id=gameweeks.seasonId
        WHERE isFinished=1 AND gameweeks.domainId=?
        GROUP BY gameweeks.seasonId
        `,
                    req.params.domainId,
                    (error, result) => {
                      if (error) return next(error);
                      if (!result[0])
                        return res
                          .status(400)
                          .json({ message: "Season not found" });
                      let q = "";
                      for (let i = 0; i < result.length; i++) {
                        q += seasonkings(result[i].seasonId);
                      }

                      connexion.query(
                        q + "SELECT * FROM seasons WHERE id=0",
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

                          if (!kings[0] || kings[0].length == 0)
                            return res
                              .status(400)
                              .json({ message: "Season not finished yet" });
                          kings[0] = kings[0].filter(
                            (el) =>
                              el.total_points != null && el.total_points != 0
                          );
                          if (kings[0].length == 0)
                            return res
                              .status(400)
                              .json({ message: "Season not finished yet" });
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

                          const data = _.orderBy(
                            kings[0],
                            "total_points",
                            "desc"
                          );

                          return res
                            .status(200)
                            .json({ message: "kings", data: data });
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
