const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

//create new quote
router.post(
  "/",
  //  [auth, authoriz],
  (req, res, next) => {
    if (!req.body.description)
      return res.status(400).json({ message: "description is required" });
    if (!req.body.author)
      return res.status(400).json({ message: "author is required" });
    const newQuote = {
      description: req.body.description,
      author: req.body.author,
    };
    connexion.query("INSERT INTO quotes SET ?", newQuote, (error, result) => {
      if (error) return next(error);
      return res.status(200).json({ message: "quote created successfully" });
    });
  }
);

//get quote
router.get(
  "/",
  //  auth,
  (req, res, next) => {
    connexion.query("SELECT * FROM quotes", (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "the are no quotes available" });
      return res
        .status(200)
        .json({ data: result[0], message: "quote loaded successfully" });
    });
  }
);

module.exports = router;
