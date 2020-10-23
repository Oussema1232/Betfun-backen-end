const express = require("express");

const router = express.Router();

router.get("/", (req, res, next) => {
  try {
    res.status(200).send("Hi welcome to betfun");
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
