const express = require("express");
const connexion = require("../startup/database");
const router = express.Router();

router.get("/", (req, res, next) => {
  connexion.query(`SELECT * FROM countries`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("the are no countries available");
    res
      .status(200)
      .json({ data: results, message: "countries loaded successfully" });
  });
});

module.exports = router;
