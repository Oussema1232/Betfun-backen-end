const express = require("express");
const connexion = require("../startup/database");
const updatebetdetails = require("../querry/updatebetdetails");
const auth = require("../middleware/auth");
const router = express.Router();

//get domains of specefic user
router.get("/:userId", (req, res, next) => {
  const q = `
  SELECT  id, userId ,domainId,domainname, logo FROM user_domains
  JOIN betfun_domains ON id=domainId
  WHERE userId=?
  `;
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.params.userId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "user not found" });
      connexion.query(q, req.params.userId, (error, results) => {
        if (error) return next(error);
        if (!results[0])
          return res
            .status(400)
            .json({ message: "You have to choose a domain" });
        return res.status(200).json({ message: "user domains", data: results });
      });
    }
  );
});

module.exports = router;
