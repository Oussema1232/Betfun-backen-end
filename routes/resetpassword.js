const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const config = require("config");
const express = require("express");
const connexion = require("../startup/database");

const router = express.Router();

router.post("/:emailtoken", (req, res, next) => {
  jwt.verify(req.params.emailtoken, config.get("emailsecret"), function (
    err,
    decoded
  ) {
    if (err) {
      if (err.message === "jwt malformed")
        return res
          .status(400)
          .json({ message: "confirmation link not valid try again later! " });
      if (err.message === "jwt expired")
        return res.status(400).json({ message: "confirmation link expired " });

      return next(err);
    }

    connexion.query(
      "SELECT * FROM users WHERE id=?",
      decoded.id,
      async (error, results) => {
        if (error) return next(error);
        if (!results[0])
          return res.status(400).json({
            message: "There is no account under this email! ",
          });
        const salt = await bcrypt.genSalt(10);
        const userpassword = await bcrypt.hash(req.body.userpassword, salt);
        connexion.query(
          "UPDATE users SET userpassword=? WHERE id=?",
          [userpassword, decoded.id],
          (error, results) => {
            if (error) return next(error);

            res.status(200).json({
              message: "Password updated successfully",
              data: decoded.email,
            });
          }
        );
      }
    );
  });
});

module.exports = router;
