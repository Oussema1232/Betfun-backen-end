const express = require("express");

const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const nanoid = require("nanoid").nanoid;

const router = express.Router();

//create league
//transaction
router.post("/", (req, res, next) => {
  if (!req.body.name) return res.status(400).send("must insert league name");
  const code = nanoid(8);
  let newLeague = {
    name: req.body.name,
    code: code,
    domainId: req.body.domainId,
  };
  connexion.beginTransaction(function (err) {
    if (err) {
      return next(err);
    }
    connexion.query(
      "INSERT INTO leagues SET?",
      newLeague,
      function (err, results, fields) {
        if (err) {
          return connexion.rollback(function () {
            return next(err);
          });
        }

        let newUserLeague = {
          userId: req.body.userId,
          leagueId: results.insertId,
        };

        connexion.query(
          "INSERT INTO user_league SET?",
          newUserLeague,
          function (err, results, fields) {
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
              res.status(200).send(code);
            });
          }
        );
      }
    );
  });
});

//join league
router.post("/join", (req, res, next) => {
  connexion.query(
    `SELECT * FROM leagues WHERE code=?`,
    req.body.code,
    function (err, results) {
      if (err) return next(err);
      let leagueresult = results[0];
      if (!leagueresult)
        return res.status(400).send("No league found under this code");

      connexion.query(
        `SELECT * FROM user_league WHERE userId=? AND leagueId=?`,
        [req.body.userId, leagueresult.id],
        function (err, results) {
          if (err) next(err);
          if (results[0])
            return res
              .status(400)
              .send("you are already registred in this league");
          connexion.query(
            `
          SELECT * FROM user_domains
          JOIN betfun_domains
          ON betfun_domains.id=domainId
          WHERE userId=? AND domainId=?
          `,
            [req.body.userId, leagueresult.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .send("user not registered in this domain");
              let q = `INSERT INTO user_league SET?`;
              let userleague = {
                userId: req.body.userId,
                leagueId: leagueresult.id,
              };
              connexion.query(q, userleague, function (err, results) {
                if (err) return next(err);
                if (results)
                  return res
                    .status(200)
                    .send(`You have successfully joined ${leagueresult.name}`);
              });
            }
          );
        }
      );
    }
  );
});

//delete leagues

router.delete("/", [authoriz], (req, res) => {
  connexion.query("DELETE FROM leagues", function (err, results) {
    if (err) return next(err);
    if (results) return res.status(200).send(`leagues table deleted`);
  });
});

//order of users in a specific league (and specific month) and specific season
router.get("/rank/:id/:seasonId/:month/:domainId", (req, res, next) => {
  const q = `
  Select username,month_name,SUM(points) AS total_points FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.gameweek=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  WHERE month_name=? AND user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId,month_name
  ORDER BY points DESC;
  `;
  connexion.query(
    q,
    [req.params.month, req.params.id, req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).json(result);
    }
  );
});

//order of users in a specific league  and specific season
router.get("/rank/:id/:seasonId/:domainId", (req, res, next) => {
  const q = `
  Select username,month_name,SUM(points) AS total_points FROM bets
  JOIN users
  ON bets.userId=users.id
  JOIN gameweeks
  ON gameweeks.gameweek=bets.gameweekId
  JOIN user_league 
  ON user_league.userId=users.id
  WHERE user_league.leagueId=? AND gameweeks.seasonId=? AND gameweeks.domainId=?
  GROUP BY bets.userId,month_name
  ORDER BY points DESC;
  `;
  connexion.query(
    q,
    [req.params.id, req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).json(result);
    }
  );
});

//get leagues of logedIn user

router.get("/:id/:domainId", (req, res, next) => {
  const q = `
  SELECT * FROM user_league
  JOIN leagues
     ON leagueId=leagues.id
  WHERE userId=? AND domainId=?
  `;
  connexion.query(q, [req.params.id, req.params.domainId], (error, results) => {
    if (error) return next(error);

    return res.status(200).json({ data: results });
  });
});

module.exports = router;
