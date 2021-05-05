const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

// nv round
router.get("/:categoryId/:language", auth, (req, res, next) => {
  let q = "";
  req.params.categoryId == "All"
    ? (q = "")
    : (q = `WHERE id=${req.params.categoryId}`);
  connexion.query("SELECT * FROM categories " + q, (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({
        message:
          req.params.language == "Arab"
            ? "الفئة غير موجودة"
            : "Category not found",
      });
    req.params.categoryId == "All"
      ? (q = "")
      : (q = `WHERE categoryId=${req.params.categoryId} `);
    connexion.query(
      "SELECT * FROM questions " +
        q +
        `ORDER BY RAND()
            limit 10`,
      (error, result) => {
        if (error) return next(error);
        if (result.length < 10)
          return res.status(400).json({
            message:
              req.params.language == "Arab"
                ? "معذرةً ، ليس لدينا أسئلة كافية في هذه الفئة ، يمكنك تجربة فئة أخرى"
                : "Sorry, we don't have enough questions in this category try an other one.",
          });
        let questions = result;
        let q = "SELECT 1;";
        questions.forEach((el) => {
          if (el.suggestorId != null)
            q += `SELECT * FROM users WHERE id=${el.suggestorId} ;`;
        });
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          result.shift();
          let suggestors = result;
          questions.forEach((el) => {
            let suggestor = [];
            el.suggestor = null;
            if (el.suggestorId != null)
              suggestor = suggestors.filter(
                (user) => user[0].id == el.suggestorId
              );
            if (suggestor[0]) el.suggestor = suggestor[0][0].username;
          });
          return res.status(200).json({
            message:
              req.params.language == "Arab"
                ? "جولتك جاهزة"
                : "Your round is ready",
            data: questions,
          });
        });
      }
    );
  });
});

//save round
router.post("/:language", auth, (req, res, next) => {
  if (req.body.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden" });
  if (!req.body.roundDetails)
    return res.status(400).json({ message: "roundDetails is required" });
  if (req.body.roundDetails.length != 10)
    return res
      .status(400)
      .json({ message: "Number of questions should be 10" });
  if (!req.body.difficultyId)
    return res.status(400).json({ message: "Difficulty is required" });

  connexion.query(
    "SELECT * FROM difficulties WHERE id=?",
    req.body.difficultyId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Difficulty not found" });
      let difficulty = result[0];
      let roundDetails = req.body.roundDetails;
      roundDetails = roundDetails.filter((el) => el.length == 2);
      if (roundDetails.length != 10)
        return res.status(400).json({ message: "invalid roundDetails" });
      let q = "";
      for (let i = 0; i < roundDetails.length; i++) {
        q += `
            SELECT * FROM questions
            WHERE id=${roundDetails[i][0]}; 
            `;
      }
      connexion.query(q, (error, result) => {
        if (error) return next(error);
        result = result.filter((el) => el.length != 0);
        if (result.length != 10)
          return res.status(400).json({ message: "invalid questionId" });

        let points = 0;
        let nbCorrect = 0;
        for (let i = 0; i < roundDetails.length; i++) {
          if (
            [
              result[i][0].EngCorrectAnswer,
              result[i][0].ArabCorrectAnswer,
            ].includes(roundDetails[i][1])
          ) {
            points += result[i][0].cote * difficulty.coefficient;
            nbCorrect += 1;
          }
        }
        if (nbCorrect < difficulty.minCorrect)
          return res.status(400).json({
            message: `Number of correct answers is less then ${difficulty.minCorrect}`,
          });
        let newRound = {
          userId: req.body.userId,
          points,
          difficultyId: req.body.difficultyId,
        };
        connexion.beginTransaction((err) => {
          if (err) {
            return next(err);
          }
          connexion.query(
            "INSERT INTO round SET ?",
            newRound,
            (error, result) => {
              if (error) {
                return connexion.rollback(function () {
                  return next(error);
                });
              }
              for (let i = 0; i < roundDetails.length; i++) {
                roundDetails[i].push(result.insertId);
              }
              let q = `INSERT INTO roundDetails(idQuestion,userAnswer,roundId) VALUES ?`;
              connexion.query(q, [roundDetails], (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                connexion.commit(function (err) {
                  if (err) {
                    return connexion.rollback(function () {
                      return next(err);
                    });
                  }
                  return res
                    .status(200)
                    .json({ message: "points", data: points });
                });
              });
            }
          );
        });
      });
    }
  );
});

module.exports = router;
