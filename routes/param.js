const express = require("express");
const bcrypt = require("bcrypt");
const connexion = require("../startup/database");
const generateAuthToken = require("../token/createtoken");
const config = require("config");
const auth = require("../middleware/auth");


const router = express.Router();

router.put("/language/:userId", auth, (req, res, next) => {
  if (req.params.userId != req.user.id)
    return res.status(403).json({ message: "Access forbidden!" });

  if (req.body.language != "Eng" && req.body.language != "Arab")
    return res.status(400).json({ message: "Language is invalid" });
  connexion.query(
    "UPDATE users SET language=? WHERE id=?",
    [req.body.language, req.params.userId],
    (error, result) => {
      if (error) return next(error);
      return res.status(200).json({ message: "Language updated" });
    }
  );
});

router.put("/username", auth, (req, res, next) => {
  if (!req.body.username)
    return res.status(400).json({ message: "username is required" });
  connexion.query(
    "SELECT * from users WHERE username=?",
    req.body.username,
    (error, result) => {
      if (error) return next(error);
      if (result[0])
        return res
          .status(400)
          .json({ message: "this Username already exists" });
      connexion.query(
        "SELECT * from users WHERE id=?",
        req.user.id,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "Bettor not found" });
          let user = result[0];
          user.username = req.body.username;
          let q = `
      UPDATE users 
      SET username=?
      WHERE id=?
      `;
          connexion.query(
            q,
            [req.body.username, req.user.id],
            (error, result) => {
              if (error) return next(error);

              const token = generateAuthToken(user, config.get("secretkey"));
              return res.status(200).json({
                message: "Username updated successfully",
                token: token,
              });
            }
          );
        }
      );
    }
  );
});

//update password

router.put("/password", auth, (req, res, next) => {
  if (!req.body.oldPassword)
    return res.status(400).json({ message: "Old password is required" });
  if (!req.body.newPassword)
    return res.status(400).json({ message: "New password is required" });
  connexion.query(
    "SELECT * FROM users WHERE id=?",
    req.user.id,

    async (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Bettor not found" });
      const user = result[0];
      try {
        const validpassword = await bcrypt.compare(
          req.body.oldPassword,
          user.userpassword
        );

        if (!validpassword)
          return res.status(400).json({ message: "Invalid password" });
        const salt = await bcrypt.genSalt(10);
        let userpassword = await bcrypt.hash(req.body.newPassword, salt);

        connexion.query(
          "UPDATE users SET userpassword=? WHERE id=?",
          [userpassword, req.user.id],
          (error, result) => {
            if (error) return next(error);
            return res.status(200).json({
              message: "Password updated successfully",
            });
          }
        );
      } catch (err) {
        return next(err);
      }
    }
  );
});

module.exports = router;
