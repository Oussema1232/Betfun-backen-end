const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

//create new information
router.post("/",
//  [auth, authoriz],
  (req, res, next) => {
  if (!req.body.engdescription)
    return res.status(400).json({ message: "engdescription is required" });
  if (!req.body.arabdescription)
    return res.status(400).json({ message: "arabdescription is required" });
  if (!req.body.categoryId)
    return res.status(400).json({ message: "categoryId is required" });
  connexion.query(
    "SELECT * FROM categories WHERE id=?",
    req.body.categoryId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "category not found" });
      const newInformation = {
        engdescription: req.body.engdescription,
        arabdescription: req.body.arabdescription,
        categoryId: req.body.categoryId,
      };
      connexion.query(
        "INSERT INTO informations SET ?",
        newInformation,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "information created successfully" });
        }
      );
    }
  );
});

//get information
router.get("/:categoryId", 
// auth,
 (req, res, next) => {
  let q = "SELECT * FROM categories ";
  if (req.params.categoryId != "all") q += `WHERE id=${req.params.categoryId}`;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({ message: "category not found" });
    let q = "SELECT * FROM informations ";
    if (req.params.categoryId != "all")
      q += `WHERE id=${req.params.categoryId}`;
    connexion.query(q, (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "the are no informations available" });
      return res
        .status(200)
        .json({ data: result[0], message: "information loaded successfully" });
    });
  });
});

module.exports = router;
