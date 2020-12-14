const express = require("express");
const auth = require("../middleware/auth");
const connexion = require("../startup/database");
const router = express.Router();

router.get("/", (req, res, next) => {
  connexion.query(`SELECT * FROM betfun_domains`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("the are no domains available");
    res
      .status(200)
      .json({ data: results, message: "domains loaded successfully" });
  });
});

module.exports = router;
