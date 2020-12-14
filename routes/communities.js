const express = require("express");
const auth = require("../middleware/auth");
const connexion = require("../startup/database");
const router = express.Router();

router.get("/", (req, res, next) => {
  connexion.query(`SELECT * FROM communities`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("the are no communities available");
    res
      .status(200)
      .json({ data: results, message: "communities loaded successfully" });
  });
});

module.exports = router;
