const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");

const router = express.Router();

router.get("/", [auth, authoriz], (req, res, next) => {
  let q = `SELECT suggestions.id,description,userId,answer,username FROM suggestions JOIN users
         ON users.id=userId`;
  connexion.query(q, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("There are no suggestions available");
    return res
      .status(200)
      .json({ data: results, message: "suggestions loaded successfully" });
  });
});

//create suggestion
router.post("/:userId/:language", auth, (req, res, next) => {
  if (req.params.userId !== req.user.id)
    return res.status(403).send("access forbidden!");
  if (!req.body.description)
    return res.status(400).json({
      message:
        req.params.language == "Arab"
          ? "لا يمكن أن يكون السؤال فارغًا"
          : "Question is required",
    });
  if (!req.body.answer)
    return res.status(400).json({
      message:
        req.params.language == "Arab"
          ? "لا يمكن أن تكون الإجابة فارغة"
          : "Answer is required",
    });
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({
          message:
            req.params.language == "Arab"
              ? "المستخدم ليس موجود"
              : "Bettor not found",
        });
      const newSuggestion = {
        userId: req.params.userId,
        description: req.body.description,
        answer: req.body.answer,
      };
      connexion.query(
        "INSERT INTO suggestions SET ?",
        newSuggestion,
        (error, result) => {
          if (error) return next(error);
          return res.status(200).json({
            message:
              req.params.language == "Arab"
                ? "تم إرسال سؤالك بنجاح"
                : "Your question was sent successfully",
          });
        }
      );
    }
  );
});

//ADMIN
router.delete("/:suggestionId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * FROM suggestions WHERE id=?",
    req.params.suggestionId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "suggestion not found" });
      connexion.query(
        "DELETE FROM suggestions WHERE id=?",
        req.params.suggestionId,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "suggestion deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
