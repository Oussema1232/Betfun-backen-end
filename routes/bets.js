const express = require("express");
const connexion = require("../startup/database");
const updatebetdetails = require("../querry/updatebetdetails");
const auth = require("../middleware/auth");
const router = express.Router();

//verifybet
router.post("/verifybet", auth, (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  connexion.query(
    "SELECT * FROM bets WHERE userId=? AND gameweekId=?",
    [req.body.userId, req.body.gameweekId],
    (err, result) => {
      if (err) return next(err);

      if (result[0])
        return res.status(200).json({ message: "Bet already created, go to Bets to update it" });
    }
  );
});
//create bet
router.post("/", auth, (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  connexion.beginTransaction(function (err) {
    if (err) {
      return next(err);
    }
    connexion.query(
      "SELECT * FROM bets WHERE userId=? AND gameweekId=?",
      [req.body.userId, req.body.gameweekId],
      (err, result) => {
        if (err) {
          return connexion.rollback(function () {
            return next(err);
          });
        }

        if (result[0])
          return res.status(400).json({ message: "Bet already created" });
        let betDetails = req.body.betdetails;
        for (let i = 0; i < betDetails.length; i++) {
          if (betDetails[i][1] == "")
            return res
              .status(400)
              .json({ message: "You should bet on all matches" });
        }

        connexion.query(
          "INSERT INTO bets SET ?",
          { userId: req.body.userId, gameweekId: req.body.gameweekId },
          (err, resultat) => {
            if (err) {
              return connexion.rollback(function () {
                return next(err);
              });
            }

            for (let i = 0; i < betDetails.length; i++) {
              betDetails[i].push(resultat.insertId);
            }

            let sql = `INSERT INTO betdetails (idMatch, guess, idBet) VALUES ?`;
            connexion.query(sql, [betDetails], (err, result) => {
              if (err) {
                return connexion.rollback(function () {
                  return next(err);
                });
              }

              connexion.commit(function (err) {
                if (err) {
                  return connexion.rollback(function () {
                    return next(err);
                  });
                }
                res.status(200).json({ message: "Bet created successfully" });
              });
            });
          }
        );
      }
    );
  });
});

//update bet

router.put("/:betId", auth, (req, res, next) => {
  let q = updatebetdetails(req.body.betdetails, req.params.betId);
  connexion.query(
    "SELECT * FROM bets WHERE id=?",
    req.params.betId,
    (err, result) => {
      if (err) {
        return next(err);
      }
      if (!result[0]) return res.status(400).json({ message: "Bet not found" });
      if (result[0].userId != req.user.id)
        return res.status(403).json({ message: "Access forbidden" });
      connexion.query(q, (err, result) => {
        if (err) {
          return next(err);
        }
        res.status(200).send("guess updated successfully");
      });
    }
  );
});

//get bets of a specific user at specefic domain and a specefic season
router.get("/:userId/:seasonId/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT * FROM bets 
  JOIN gameweeks 
  ON gameweekId=gameweeks.id
  WHERE userId=? AND gameweeks.seasonId=? AND domainId=?;
  `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "Bettor is not registered at this domain" });
              connexion.query(
                q,
                [req.params.userId, req.params.seasonId, req.params.domainId],
                (error, result) => {
                  if (error) return next(error);
                  return res.status(200).json({ data: result });
                }
              );
            }
          );
        }
      );
    }
  );
});

//get bet of a specific user at a specific gameweek at a specific season
router.get("/:userId/:gameweekId", auth, (req, res, next) => {
  const q = `
      SELECT * FROM bets 
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      WHERE userId=? AND gameweeks.id=? ;
      `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      connexion.query(
        "SELECT * FROM gameweeks WhERE id=?",
        req.params.gameweekId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "gameweek not found" });
          let gameweek = result[0];
          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, gameweek.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "Bettor is not registered at this domain" });
              connexion.query(
                q,
                [req.params.userId, req.params.gameweekId],
                (error, result) => {
                  if (error) return next(error);
                  return res.status(200).send(result);
                }
              );
            }
          );
        }
      );
    }
  );
});

//get bets of specific user at specific domain (all season)
router.get("/all/seasons/:userId/:domainId", auth, (req, res, next) => {
  const q = `
      SELECT bets.id as id ,gameweeks.name as gameweekname,seasonId,gameweeks.id as gameweekId,userId,gameweekId,bets.created_at,points,domainId,date_format(bets.created_at,'%d/%m/%y') as date,
      date_format(bets.created_at,'%H:%i')  as time FROM bets
      JOIN gameweeks
      ON gameweeks.id=bets.gameweekId
      WHERE userId=? AND domainId=? ;
      `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      connexion.query(
        "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
        [req.params.userId, req.params.domainId],
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res
              .status(400)
              .json({ message: "Bettor is not registered at this domain" });
          connexion.query(
            q,
            [req.params.userId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              return res.status(200).json({ data: result });
            }
          );
        }
      );
    }
  );
});

//get domains of specefic user
router.get("/:userId", auth, (req, res, next) => {
  const q = `
  SELECT domainId,name as domain_name, logo FROM user_domains
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
        return res
          .status(200)
          .json({ message: "Bettor domains", data: results });
      });
    }
  );
});

module.exports = router;
