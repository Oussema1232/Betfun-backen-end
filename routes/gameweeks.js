const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

//get gameweeks of specific domain
router.get("/:domainId", (req, res, next) => {
  const q = `
  SELECT gameweeks.id as id,gameweeks.name as name FROM gameweeks 
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
              return res
                .status(400)
                .json({ message: "gameweeks of season", data: result });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
