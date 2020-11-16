const express = require("express");

const router = express.Router();

router.get("/", (req, res, next) => {
  try {
    res
      .status(200)
      .json({ message: "Hi welcome to betfun", request: req.baseUrl });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
