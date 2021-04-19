const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const efficiencyFunc = require("../querry/statsfunction");

const router = express.Router();

//accuracy and efficiency
router.get(
  "/:userId/:domainId",
  auth,
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM users WHERE id=?",
      req.params.userId,
      (error, result) => {
        if (!result[0])
          return res.status(400).json({ message: "Bettor not found" });
        connexion.query(
          "SELECT * FROM betfun_domains WHERE id=?",
          req.params.domainId,
          (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res.status(400).json({ message: "Domain not found" });
            connexion.query(
              "SELECT * FROM user_domains WHERE userId=? AND domainId=?",
              [req.params.userId, req.params.domainId],
              (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res
                    .status(400)
                    .json({ message: "Bettor is not registered at this domain" });
                let q = `
                    SELECT * FROM bets 
                    JOIN gameweeks
                    ON gameweeks.id=gameweekId
                    WHERE userId=? AND domainId=?
                    `;
                let data = {
                  totalAcc: 0,
                  totalEff: 0,
                  seasons: [],
                };
                connexion.query(
                  q,
                  [req.params.userId, req.params.domainId],
                  (error, result) => {
                    if (error) return next(error);
                    if (result.length == 0)
                      return res.status(200).json({
                        message: "Bettor has not played any match",
                        data,
                      });
                    let q = `
                        select bets.gameweekId,
                            gameweeks.name as gameweek,
                            seasonId,
                            seasons.name as season,
                            idMatch,
                            guess,
                            bingo,
                            cote_1,
                            cote_2,
                            cote_x 
                        from bets
                        join betdetails
                        on bets.id=idBet
                        join calendar_results
                        on idMatch=calendar_results.id
                        join gameweeks
                        on gameweeks.id=bets.gameweekId
                        join seasons 
                        on seasons.id=seasonId
                        WHERE userId=${req.params.userId} AND domainId=${req.params.domainId} AND bingo IS NOT NULL
                        `;
                    let qs = q + " GROUP BY seasonId;";
                    let qw = q + " GROUP BY gameweekId;";
                    connexion.query(qs + qw + q, (error, result) => {
                      if (error) return next(error);
                      if (result[0].length == 0)
                        return res.status(200).json({
                          message: "Bettor has not played any finished match",
                          data,
                        });

                      let correct = result[2].filter(
                        (el) => el.guess == el.bingo
                      );
                      data.totalAcc = parseFloat(
                        ((correct.length / result[2].length) * 100).toFixed(2)
                      );
                      data.totalEff = efficiencyFunc(result[2]).efficiency;

                      for (let i = 0; i < result[0].length; i++) {
                        let seasonData = result[2].filter(
                          (el) => el.seasonId == result[0][i].seasonId
                        );
                        let gameweeks = result[1].filter(
                          (el) => el.seasonId == result[0][i].seasonId
                        );
                        let correct = seasonData.filter(
                          (el) => el.guess == el.bingo
                        );
                        data.seasons.push({
                          id: result[0][i].seasonId,
                          name: result[0][i].season,
                          acc: parseFloat(
                            (
                              (correct.length / seasonData.length) *
                              100
                            ).toFixed(2)
                          ),
                          eff: efficiencyFunc(seasonData).efficiency,
                          points: efficiencyFunc(seasonData).correctPoints,
                          gameweeks: [],
                        });
                        for (let j = 0; j < gameweeks.length; j++) {
                          let gameweekData = seasonData.filter(
                            (el) => el.gameweekId == gameweeks[j].gameweekId
                          );
                          let correct = gameweekData.filter(
                            (el) => el.guess == el.bingo
                          );
                          data.seasons[i].gameweeks.push({
                            id: gameweeks[j].gameweekId,
                            name: gameweeks[j].gameweek,
                            acc: parseFloat(
                              (
                                (correct.length / gameweekData.length) *
                                100
                              ).toFixed(2)
                            ),
                            eff: efficiencyFunc(gameweekData).efficiency,
                          });
                        }
                      }
                      return res
                        .status(200)
                        .json({ message: "accuracy and efficiency", data });
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

module.exports = router;
