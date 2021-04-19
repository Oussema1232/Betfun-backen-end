const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");

const router = express.Router();

//get all difficulties
router.get(
  "/:language",
  auth,
  (req, res, next) => {
    connexion.query("SELECT * FROM difficulties", (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({
          message:
            req.params.language == "Arab"
              ? "لا توجد مستويات متاحة"
              : "There are no levels available",
        });
      return res.status(200).json({
        message:
          req.params.language == "Arab"
            ? "المستويات المتاحة"
            : "Levels available",
        data: result,
      });
    });
  }
);

//add new difficulty
router.post(
  "/",
  [auth, authoriz],
  (req, res, next) => {
    if (!req.body.Engname || req.body.Engname.length == 0)
      return res.status(400).json({ message: "name is required" });
    if (!req.body.Arabname || req.body.Arabname.length == 0)
      return res.status(400).json({ message: "name is required" });
    if (!req.body.coefficient)
      return res.status(400).json({ message: "coefficient is required" });
    if (!req.body.minCorrect)
      return res.status(400).json({ message: "minCorrect is required" });
    if (req.body.minCorrect < 0 || req.body.minCorrect > 10)
      return res.status(400).json({ message: "invalid minCorrect" });

    let newDifficulty = {
      Engname: req.body.Engname,
      Arabname: req.body.Arabname,
      coefficient: req.body.coefficient,
      minCorrect: req.body.minCorrect,
    };
    connexion.query(
      "INSERT INTO difficulties SET ?",
      newDifficulty,
      (error, result) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ message: "difficulty created successfully" });
      }
    );
  }
);

//update difficulty
router.put(
  "/:difficultyId",
  [auth, authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM difficulties WHERE id=?",
      req.params.difficultyId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "difficulty not found" });
        let difficulty = result[0];
        let minCorrect = req.body.minCorrect || difficulty.minCorrect;
        if (minCorrect < 0 || minCorrect > 10)
          return res.status(400).json({ message: "invalid minCorrect" });
        let q = `
        update difficulties
        SET Engname="${req.body.Engname || difficulty.Engname}",
        Arabname="${req.body.Arabname || difficulty.Arabname}",
        coefficient=${req.body.coefficient || difficulty.coefficient},
        minCorrect=${minCorrect}
        WHERE id=${req.params.difficultyId}
        `;
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "difficulty updated successfully" });
        });
      }
    );
  }
);

//delete difficulty
router.delete(
  "/:difficultyId",
  [auth,authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * From difficulties WHERE id=?",
      req.params.difficultyId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "difficulty not found" });
        connexion.query(
          "DELETE FROM difficulties WHERE id=?",
          req.params.difficultyId,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "difficulty deleted successfully" });
          }
        );
      }
    );
  }
);

module.exports = router;
