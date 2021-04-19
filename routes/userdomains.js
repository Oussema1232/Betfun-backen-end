const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");


const router = express.Router();

//get domains of specefic user
router.get("/:userId", auth, (req, res, next) => {
  
  const q = `
  SELECT  id, userId ,domainId,domainname, logo FROM user_domains
  JOIN betfun_domains ON id=domainId
  WHERE userId=?
  `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      connexion.query(q, req.params.userId, (error, results) => {
        if (error) return next(error);
        if (!results[0])
          return res
            .status(400)
            .json({ message: "You have to choose a domain" });
        return res
          .status(200)
          .json({ message: "Your bet domains", data: results });
      });
    }
  );
});

//register at new domain

router.post("/", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.body.id,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "Domain not found", id: "notfound" });

      let domain = {
        ...result[0],
        domainId: result[0].id,

        userId: req.user.id,
      };
      connexion.query(
        "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
        [6, req.user.id],
        (error, result) => {
          if (error) return next(error);
          if (result[0])
            return res.status(400).json({
              message: "You are already registred at this domain",
              id: req.body.id,
            });
          connexion.beginTransaction((err) => {
            if (err) {
              return next(err);
            }
            const userDomain = {
              userId: req.user.id,

              domainId: req.body.id,
            };
            connexion.query(
              "INSERT INTO user_domains SET ?",
              userDomain,
              (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                connexion.query(
                  "SELECT * FROM leagues WHERE domainId=? AND countryId=?",
                  [req.body.id, req.user.countryId],
                  (error, result) => {
                    if (error) {
                      return connexion.rollback(function () {
                        return next(error);
                      });
                    }
                    const userLeague = {
                      userId: req.user.id,

                      leagueId: result[0].id,
                    };
                    connexion.query(
                      "INSERT into user_league SET ?",
                      userLeague,
                      (error, result) => {
                        if (error) {
                          return connexion.rollback(function () {
                            return next(error);
                          });
                        }
                        connexion.commit(function (err) {
                          if (err) {
                            return connexion.rollback(function () {
                              return next(err);
                            });
                          }
                          return res.status(200).json({
                            message: "Domain added successfully, good luck",
                            id: req.body.id,
                            domain,
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

module.exports = router;
