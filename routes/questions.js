const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");

const router = express.Router();

//get questions
router.get(
  "/:categoryId",
  auth,
  (req, res, next) => {
    let q = `SELECT * FROM categories WHERE id=${req.params.categoryId};`;

    connexion.query(q, (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "category not found" });
      let q = `SELECT questions.id as id, Engdescription,Arabdescription,username as suggestorname,
               ArabAnswerone,ArabAnswertwo,ArabAnswerthree, ArabAnswerfour, 
               EngAnswerone,EngAnswertwo,EngAnswerthree, EngAnswerfour,
               ArabCorrectAnswer,EngCorrectAnswer,cote,categoryId,
               users.id as userId,username
               FROM questions
               LEFT JOIN users ON suggesterId=users.id
               WHERE categoryId=${req.params.categoryId};`;

      connexion.query(q, (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res
            .status(400)
            .json({ message: "there are no questions available" });
        return res.status(200).json({
          data: result,
          message: "questions loaded successfully",
        });
      });
    });
  }
);

//create new question
router.post(
  "/",
  [auth, authoriz],
  (req, res, next) => {
    if (!req.body.Engdescription || req.body.Engdescription.length == 0)
      return res.status(400).json({ message: "Engdescription is required" });
    if (!req.body.Arabdescription || req.body.Arabdescription.length == 0)
      return res.status(400).json({ message: "Arabdescription is required" });
    if (!req.body.categoryId || req.body.categoryId.length == 0)
      return res.status(400).json({ message: "categoryId is required" });
    if (!req.body.EngAnswerone || req.body.EngAnswerone.length == 0)
      return res.status(400).json({ message: "EngAnswerone is required" });
    if (!req.body.EngAnswertwo || req.body.EngAnswertwo.length == 0)
      return res.status(400).json({ message: "EngAnswertwo is required" });
    if (!req.body.EngAnswerthree || req.body.EngAnswerthree.length == 0)
      return res.status(400).json({ message: "EngAnswerthree is required" });
    if (!req.body.EngAnswerfour || req.body.EngAnswerfour.length == 0)
      return res.status(400).json({ message: "EngAnswerfour is required" });
    if (!req.body.EngCorrectAnswer || req.body.EngCorrectAnswer.length == 0)
      return res.status(400).json({ message: "EngCorrectAnswer is required" });
    if (!req.body.ArabAnswerone || req.body.ArabAnswerone.length == 0)
      return res.status(400).json({ message: "ArabAnswerone is required" });
    if (!req.body.ArabAnswertwo || req.body.ArabAnswertwo.length == 0)
      return res.status(400).json({ message: "ArabAnswertwo is required" });
    if (!req.body.ArabAnswerthree || req.body.ArabAnswerthree.length == 0)
      return res.status(400).json({ message: "ArabAnswerthree is required" });
    if (!req.body.ArabAnswerfour || req.body.ArabAnswerfour.length == 0)
      return res.status(400).json({ message: "ArabAnswerfour is required" });
    if (!req.body.ArabCorrectAnswer || req.body.ArabCorrectAnswer.length == 0)
      return res.status(400).json({ message: "ArabCorrectAnswer is required" });
    connexion.query(
      "SELECT * FROM categories WHERE id=?",
      req.body.categoryId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "category not found" });
        let q = "SELECT 1 ";
        if (req.body.suggesterId)
          q = `SELECT * FROM users WHERE id=${req.body.suggesterId}`;
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "suggesterId is invalid" });
          let newQuestion = {
            Engdescription: req.body.Engdescription,
            Arabdescription: req.body.Arabdescription,
            categoryId: req.body.categoryId,
            EngAnswerone: req.body.EngAnswerone,
            EngAnswertwo: req.body.EngAnswertwo,
            EngAnswerthree: req.body.EngAnswerthree,
            EngAnswerfour: req.body.EngAnswerfour,
            EngCorrectAnswer: req.body.EngCorrectAnswer,
            ArabAnswerone: req.body.ArabAnswerone,
            ArabAnswertwo: req.body.ArabAnswertwo,
            ArabAnswerthree: req.body.ArabAnswerthree,
            ArabAnswerfour: req.body.ArabAnswerfour,
            ArabCorrectAnswer: req.body.ArabCorrectAnswer,
            suggesterId: req.body.suggesterId || null,
          };
          connexion.query(
            "INSERT into questions SET ?",
            newQuestion,
            (error, result) => {
              if (error) return next(error);
              return res
                .status(200)
                .json({ message: "question created successfully" });
            }
          );
        });
      }
    );
  }
);

//update cote
router.put("/",[auth, authoriz], (req, res, next) => {
  if (!req.body.cote)
    return res.status(400).json({ message: "cote is required" });
  let q = `UPDATE questions SET cote=${req.body.cote}`;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    return res
      .status(200)
      .json({ message: "questions cote updated successfully" });
  });
});

//update question
router.put(
  "/:questionId",
   [auth, authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM questions WHERE id=?",
      req.params.questionId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "question not found" });
        let question = result[0];
        let q = `SELECT * FROM categories WHERE id=${
          req.body.categoryId || question.categoryId
        }`;
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "category not found" });
          let q = "SELECT 1 ";
          if (req.body.suggesterId)
            q = `SELECT * FROM users WHERE id=${req.body.suggesterId}`;
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            if (!result[0])
              return res
                .status(400)
                .json({ message: "suggesterId is invalid" });
            q = `
              UPDATE questions SET 
              Engdescription="${
                req.body.Engdescription || question.Engdescription
              }",
              Arabdescription="${
                req.body.Arabdescription || question.Arabdescription
              }",
              categoryId=${req.body.categoryId || question.categoryId},
              EngAnswerone="${req.body.EngAnswerone || question.EngAnswerone}",
              EngAnswertwo="${req.body.EngAnswertwo || question.EngAnswertwo}",
              EngAnswerthree="${
                req.body.EngAnswerthree || question.EngAnswerthree
              }",
              EngAnswerfour="${
                req.body.EngAnswerfour || question.EngAnswerfour
              }",
              EngCorrectAnswer="${
                req.body.EngCorrectAnswer || question.EngCorrectAnswer
              }",
              ArabAnswerone="${
                req.body.ArabAnswerone || question.ArabAnswerone
              }",
              ArabAnswertwo="${
                req.body.ArabAnswertwo || question.ArabAnswertwo
              }",
              ArabAnswerthree="${
                req.body.ArabAnswerthree || question.ArabAnswerthree
              }",
              ArabAnswerfour="${
                req.body.ArabAnswerfour || question.ArabAnswerfour
              }",
              arabCorrectAnswer="${
                req.body.ArabCorrectAnswer || question.ArabCorrectAnswer
              }",
              suggesterId=${req.body.suggesterId || question.suggesterId},
              cote=${req.body.cote || question.cote}
              WHERE id=${req.params.questionId}
              `;
            connexion.query(q, (error, result) => {
              if (error) return next(error);
              return res
                .status(200)
                .json({ message: "question updated successfully" });
            });
          });
        });
      }
    );
  }
);

//delete question
router.delete(
  "/:questionId",
  [auth, authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECt * FROM questions WHERE id=?",
      req.params.questionId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "question not found" });
        connexion.query(
          "DELETE FROM questions WHERE id=?",
          req.params.questionId,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "question deleted successfully" });
          }
        );
      }
    );
  }
);

module.exports = router;
