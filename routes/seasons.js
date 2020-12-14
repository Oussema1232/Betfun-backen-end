const express = require("express");
const auth = require("../middleware/auth");
const connexion = require("../startup/database");
const router = express.Router();

router.get("/", (req, res, next) => {
  connexion.query(`SELECT * FROM seasons`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("the are no seasons available");
    res
      .status(200)
      .json({ data: results, message: "seasons loaded successfully" });
  });
});

//get seasons of specific domain
router.get("/:domainId", (req, res, next) => {
  const q = `
  SELECT seasons.id AS id , seasons.name AS name FROM seasons
  JOIN gameweeks 
  ON seasons.id=seasonId
  WHERE domainId=?
  GROUP BY seasonId;
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(q, req.params.domainId, (error, result) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ message: "seasons of domains", data: result });
      });
    }
  );
});

module.exports = router;
