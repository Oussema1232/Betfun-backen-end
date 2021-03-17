const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

//get gameweeks of specific domain
router.get("/:domainId", (req, res, next) => {
  const q = `
  SELECT gameweeks.id as id,gameweeks.name as name, seasons.id as seasonId, month_name as month,domainId FROM gameweeks 
  join seasons on seasonId=seasons.id
  WHERE domainId=?
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(q, req.params.domainId, (error, results) => {
        if (error) return next(error);
        return res.status(200).json({ message: "gameweeks", data: results });
      });
    }
  );
});

//get gameweeks of specific season
router.get("/:seasonId/:domainId", (req, res, next) => {
  const q = `
  SELECT gameweeks.id as id,gameweeks.name as name FROM gameweeks 
  join seasons on seasonId=seasons.id
  join betfun_domains on domainId=betfun_domains.id
  WHERE seasonId=? AND  domainId=?
  `;
  connexion.query(
    "SELECT * FROM seasons WHERE id=?",
    req.params.seasonId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "season not found" });
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        req.params.domainId,
        (error, results) => {
          if (error) return next(error);
          if (!results[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            q,
            [req.params.seasonId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res.status(400).json({ message: "no gameweeks" });
              return res.status(200).json({
                message: "gameweeks of season",
                data: result,
              });
            }
          );
        }
      );
    }
  );
});

//Admin

//add new gameweek

router.post(
  "/",
  // ,[auth,authoriz]
  (req, res, next) => {
    if (!req.body.name)
      return res.status(400).json({ message: "name of gameweek required" });
    if (!req.body.month)
      return res.status(400).json({ message: "month required" });
    if (!req.body.seasonId)
      return res.status(400).json({ message: "seasonId required" });
    if (!req.body.domainId)
      return res.status(400).json({ message: "domainId required" });
    connexion.query(
      "SELECT * FROM betfun_domains WHERE id=?",
      req.body.domainId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "domain not found" });
        connexion.query(
          "SELECT * FROM seasons WHERE id=?",
          req.body.seasonId,
          (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res.status(400).json({ message: "season not found" });
            let newGameweek = {
              name: req.body.name,
              month_name: req.body.month,
              seasonId: req.body.seasonId,
              domainId: req.body.domainId,
            };
            connexion.query(
              "SELECT * FROM domain_seasonstatus WHERE domainId=? AND seasonId=?",
              [req.body.domainId, req.body.seasonId],
              (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res
                    .status(400)
                    .json({ message: "domain_seasonstatus not found" });
                if (result[0].isfinished == 1)
                  return res
                    .status(400)
                    .json({ message: "domain_seasonstatus is finished" });
                connexion.query(
                  "INSERT INTO gameweeks SET ?",
                  newGameweek,
                  (error, result) => {
                    if (error) return next(error);
                    return res
                      .status(200)
                      .json({ message: "gameweek created successfully" });
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

//update gameweek
router.put(
  "/:gameweekId",
  // ,[auth,authoriz]
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM gameweeks WHERE id=?",
      req.params.gameweekId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "gameweek not found" });
        let gameweek = result[0];
        let domainId = req.body.domainId || gameweek.domainId;
        let seasonId = req.body.seasonId || gameweek.seasonId;
        let q = `
       UPDATE gameweeks SET
       name="${req.body.name || gameweek.name}",
       month_name="${req.body.month || gameweek.month_name}",
       domainId=${domainId},
       seasonId=${seasonId}
       WHERE id=${req.params.gameweekId}
       `;
        connexion.query(
          "SELECT * FROM seasons WHERE id=?",
          seasonId,
          (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res.status(400).json({ message: "season not found" });
            connexion.query(
              "SELECT * FROM betfun_domains WHERE id=?",
              domainId,
              (error, result) => {
                if (error) return next(error);
                if (!result[0])
                  return res.status(400).json({ message: "domain not found" });
                connexion.query(
                  "SELECT * FROM domain_seasonstatus WHERE domainId=? AND seasonId=?",
                  [domainId, seasonId],
                  (error, result) => {
                    if (error) return next(error);
                    if (!result[0])
                      return res
                        .status(400)
                        .json({ message: "domain_seasonstatus not found" });
                    if (result[0].isfinished == 1)
                      return res
                        .status(400)
                        .json({ message: "domain_seasonstatus is finished" });
                    connexion.query(q, (error, result) => {
                      if (error) return next(error);
                      return res
                        .status(200)
                        .json({ message: "gameweek updated successfully" });
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

//delete gameweek
router.delete(
  "/:gameweekId",
  // ,[auth,authoriz]
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM gameweeks WHERE id=?",
      req.params.gameweekId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "gameweek not found" });
        connexion.query(
          "DELETE FROM gameweeks WHERE id=?",
          req.params.gameweekId,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "gameweek deleted successfully" });
          }
        );
      }
    );
  }
);

module.exports = router;
