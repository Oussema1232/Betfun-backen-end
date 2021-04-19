const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const router = express.Router();

//get all points of specific user
router.get("/points/:userId", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      let q = `
        SELECT userId,SUM(points) AS total_points FROM round
        WHERE userId=?
        GROUP BY userId
        `;
      connexion.query(q, req.params.userId, (error, result) => {
        if (error) return next(error);
        let data = {
          userId: req.params.userId,
          total_points: result[0] ? result[0].total_points : 0,
        };
        return res.status(200).json({ message: "total points", data });
      });
    }
  );
});

//get rank of specific user
router.get("/rank/:userId", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      let q = `
        SELECT users.id AS userId,users.username,SUM(points) AS total_points FROM round
        RIGHT JOIN users ON users.id=userId
        GROUP BY users.id
        ORDER BY total_points DESC;
        `;
      connexion.query(q, (error, result) => {
        if (error) return next(error);
        let rank = result;
        rank.forEach((el, index) => {
          if (el.total_points == null) {
            el.total_points = 0;
          }
          if (index == 0) el.rank = 1;
          else if (el.total_points == rank[index - 1].total_points)
            el.rank = rank[index - 1].rank;
          else el.rank = index + 1;
        });
        let userRank = rank.filter((el) => el.userId == req.params.userId);
        return res
          .status(200)
          .json({ message: "user rank", data: userRank[0] });
      });
    }
  );
});

//get ranks
router.get("/rank", auth, (req, res, next) => {
  let q = `
        SELECT users.id AS userId,users.username,SUM(points) AS total_points FROM round
        RIGHT JOIN users ON users.id=userId
        GROUP BY users.id
        ORDER BY total_points DESC;
    `;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    let rank = result;
    rank.forEach((el, index) => {
      if (el.total_points == null) {
        el.total_points = 0;
      }
      if (index == 0) el.rank = 1;
      else if (el.total_points == rank[index - 1].total_points)
        el.rank = rank[index - 1].rank;
      else el.rank = index + 1;
    });
    return res.status(200).json({ message: "ranks", data: rank });
  });
});

//categories percentage
router.get("/percentage/:userId", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      let q = `
        SELECT categories.id AS categoryId,categories.name AS category,sum(points) AS points FROM 
        (SELECT round.userId,categoryId,
        CASE
            WHEN userAnswer=engCorrectAnswer THEN cote*coefficient
            WHEN userAnswer=arabCorrectAnswer THEN cote*coefficient
            ELSE 0
            END AS points
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
            .json({ message: "the are no categories available" });
        let categories = result;
        let total_point = 0;
        categories.forEach((el) => {
          if (el.points == null) el.points = 0;
          total_point += el.points;
        });
        categories.forEach((el) => {
          if (total_point != 0)
            el.percentage = ((el.points / total_point) * 100).toFixed(2);
          else el.percentage = "00.00";
        });
        return res
          .status(200)
          .json({ message: "percentage", data: categories });
      });
    }
  );
});

module.exports = router;
