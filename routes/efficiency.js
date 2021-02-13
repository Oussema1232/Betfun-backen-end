const express = require("express");
const connexion = require("../startup/database");
const updatebetdetails = require("../querry/updatebetdetails");
const auth = require("../middleware/auth");

const router = express.Router();

//accuracy of specific user all time
router.get("/:userId/:domainId", (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
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
                  .json({ message: "user is not registered at this domain" });
              let q = `
                    select bets.gameweekId,idMatch,guess,bingo,cote_1,cote_2,cote_x from bets
                    join betdetails
                    on bets.id=idBet
                    join calendar_results
                    on idMatch=calendar_results.id
                    join gameweeks
                    on gameweeks.id=bets.gameweekId
                    WHERE userId=? AND domainId=? AND bingo IS NOT NULL;
                    `;
              connexion.query(
                q,
                [req.params.userId, req.params.domainId],
                (error, result) => {
                  if (error) return next(error);
                  if (result.length == 0)
                    return res.status(400).json({
                      message: "user has not played any finished match",
                    });
                  let correctPoints = 0;
                  let sumPoints = 0;
                  for (let i = 0; i < result.length; i++) {
                    if (result[i].bingo == "1") {
                      sumPoints += result[i].cote_1;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_1;
                    }
                    if (result[i].bingo == "2") {
                      sumPoints += result[i].cote_2;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_2;
                    }
                    if (result[i].bingo == "x") {
                      sumPoints += result[i].cote_x;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_x;
                    }
                  }
                  let accuracy = ((correctPoints / sumPoints) * 100).toFixed(2);
                  return res
                    .status(200)
                    .json({ message: "accuracy", data: accuracy });
                }
              );
            }
          );
        }
      );
    }
  );
});
//accuracy of specific user at specific gameweek
router.get("/gameweek/:userId/:gameweekId", (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      connexion.query(
        "SELECT * FROM gameweeks WHERE id=?",
        req.params.gameweekId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "gameweek not found" });
          connexion.query(
            "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
            [req.params.userId, result[0].domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "user is not registered at this domain" });
              let q = `
                    select bets.gameweekId,idMatch,guess,bingo,cote_1,cote_2,cote_x from bets
                    join betdetails
                    on bets.id=idBet
                    join calendar_results
                    on idMatch=calendar_results.id
                    join gameweeks
                    on gameweeks.id=bets.gameweekId
                    WHERE userId=? AND bets.gameweekId=? AND bingo IS NOT NULL;
                    `;
              connexion.query(
                q,
                [req.params.userId, req.params.gameweekId],
                (error, result) => {
                  if (error) return next(error);
                  if (result.length == 0)
                    return res.status(400).json({
                      message: "user has not played any finished match",
                    });
                  let correctPoints = 0;
                  let sumPoints = 0;
                  for (let i = 0; i < result.length; i++) {
                    if (result[i].bingo == "1") {
                      sumPoints += result[i].cote_1;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_1;
                    }
                    if (result[i].bingo == "2") {
                      sumPoints += result[i].cote_2;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_2;
                    }
                    if (result[i].bingo == "x") {
                      sumPoints += result[i].cote_x;
                      if (result[i].guess == result[i].bingo)
                        correctPoints += result[i].cote_x;
                    }
                  }
                  let accuracy = ((correctPoints / sumPoints) * 100).toFixed(2);
                  return res
                    .status(200)
                    .json({ message: "accuracy", data: accuracy });
                }
              );
            }
          );
        }
      );
    }
  );
});

//accuracy of specific user at specific season
router.get("/season/:userId/:domainId/:seasonId", (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
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
                  .json({ message: "user is not registered at this domain" });
              let q = `
                    select bets.gameweekId,idMatch,guess,bingo,cote_1,cote_2,cote_x from bets
                    join betdetails
                    on bets.id=idBet
                    join calendar_results
                    on idMatch=calendar_results.id
                    join gameweeks
                    on gameweeks.id=bets.gameweekId
                    WHERE userId=? AND domainId=? AND seasonId=? AND bingo IS NOT NULL;
                    `;
              connexion.query(
                "SELECT * FROM seasons WHERE id=?",
                req.params.seasonId,
                (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res
                      .status(400)
                      .json({ message: "season not found" });
                  connexion.query(
                    "SELECT * FROM domain_seasonstatus WHERE domainId=? AND seasonId=?",
                    [req.params.domainId, req.params.seasonId],
                    (error, result) => {
                      if (error) return next(error);
                      if (!result[0])
                        return res
                          .status(400)
                          .json({ message: "domain_seasonstatus not found" });
                      connexion.query(
                        q,
                        [
                          req.params.userId,
                          req.params.domainId,
                          req.params.seasonId,
                        ],
                        (error, result) => {
                          if (error) return next(error);
                          if (result.length == 0)
                            return res.status(400).json({
                              message: "user has not played any finished match",
                            });
                          let correctPoints = 0;
                          let sumPoints = 0;
                          for (let i = 0; i < result.length; i++) {
                            if (result[i].bingo == "1") {
                              sumPoints += result[i].cote_1;
                              if (result[i].guess == result[i].bingo)
                                correctPoints += result[i].cote_1;
                            }
                            if (result[i].bingo == "2") {
                              sumPoints += result[i].cote_2;
                              if (result[i].guess == result[i].bingo)
                                correctPoints += result[i].cote_2;
                            }
                            if (result[i].bingo == "x") {
                              sumPoints += result[i].cote_x;
                              if (result[i].guess == result[i].bingo)
                                correctPoints += result[i].cote_x;
                            }
                          }
                          let accuracy = (
                            (correctPoints / sumPoints) *
                            100
                          ).toFixed(2);
                          return res
                            .status(200)
                            .json({ message: "accuracy", data: accuracy });
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
