const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");


const router = express.Router();


//categories percentage
router.get(
  "/stats/:userId",
  auth,
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM users WHERE id=?",
      req.params.userId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "user not found" });
        let q = `
        SELECT categories.id AS categoryId,categories.Engname AS category,sum(points) AS points,sum(idealpoint) as idealpoints FROM 
        (SELECT round.userId,categoryId,
        CASE
            WHEN userAnswer=EngCorrectAnswer THEN cote*coefficient
            WHEN userAnswer=ArabCorrectAnswer THEN cote*coefficient
            ELSE 0
            END AS points,
            (cote*coefficient) as idealpoint
        FROM rounddetails
        JOIN round ON roundId=round.id
        JOIN difficulties ON difficultyId=difficulties.id
        JOIN questions ON questions.id=idQuestion
        WHERE userId=${req.params.userId}) tab
		RIGHT JOIN categories ON categoryId=categories.id
        GROUP BY categories.id
        `;
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res
              .status(400)
              .json({ message: "There are no categories available" });
          let categories = result;

          categories.forEach((el) => {
            if (el.points == null) el.points = 0;
          });
          let totalpoints = 0;
          categories.forEach((el) => {
            totalpoints += el.points;
            if (el.points != 0)
              el.percentage = ((el.points / el.idealpoints) * 100).toFixed(2);
            else el.percentage = 00,00;
          });

          return res
            .status(200)
            .json({ message: "percentage", data: { totalpoints, categories } });
        });
      }
    );
  }
);

module.exports = router;
