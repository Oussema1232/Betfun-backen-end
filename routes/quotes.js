const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

//get quote
router.get("/", auth, (req, res, next) => {
  connexion.query("SELECT * FROM quotes", (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({ message: "there are no quotes available" });
    return res
      .status(200)
      .json({ data: result, message: "quotes loaded successfully" });
  });
});

router.get("/one", auth, (req, res, next) => {
  connexion.query("SELECT * FROM quotes", (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({ message: "There are no quotes available" });
    let quotes = result;
    connexion.query(
      "SELECT * ,CURDATE() as new_date FROM get_quotes",
      (error, result) => {
        if (error) return next(error);
        let q = "";
        let quote;
        if (!result[0]) {
          q = `INSERT INTO get_quotes(quoteId,update_date) VALUES(${quotes[0].id},CURDATE())`;
          quote = quotes[0];
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ data: quote, message: "quote loaded successfully" });
          });
        } else {
          dateDiff =
            (result[0].new_date - result[0].update_date) / (1000 * 3600 * 24);
          let index = quotes.findIndex((el) => el.id == result[0].quoteId);
          if (dateDiff < 3)
            return res.status(200).json({
              data: quotes[index],
              message: "quote loaded successfully",
            });
          quotes.length == index + 1 ? (index = 0) : (index = index + 1);
          q = `
              UPDATE get_quotes 
              SET quoteId=${quotes[index].id} ,
                  update_date=CURDATE()
              `;
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            return res.status(200).json({
              data: quotes[index],
              message: "quote loaded successfully",
            });
          });
        }
      }
    );
  });
});

//create new quote
router.post("/", [auth, authoriz], (req, res, next) => {
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
});

//update quote
router.put("/:quoteId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * From quotes WHERE id=?",
    req.params.quoteId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "quote not found" });
      let quote = result[0];
      let q = `
        UPDATE quotes SET
            description="${req.body.description || quote.description}",
            author="${req.body.author || quote.author}"
        WHERE id=${req.params.quoteId};
        `;
      connexion.query(q, (error, result) => {
        if (error) return next(error);
        return res.status(200).json({ message: "quote updated successfully" });
      });
    }
  );
});

//delete quote
router.delete("/:quoteId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * From quotes WHERE id=?",
    req.params.quoteId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "quote not found" });
      connexion.query(
        "DELETE FROM quotes WHERE id=?",
        req.params.quoteId,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "quote deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
