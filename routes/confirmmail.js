const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const config = require("config");
const express = require("express");
const generateAuthToken = require("../token/createtoken");
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
      (error, results) => {
        if (error) return next(error);
        if (!results[0])
          return res.status(400).json({
            message: "there is no account under this email! ",
          });
        if (req.body.data == "register/confirmation") {
          connexion.query(
            "UPDATE users SET isConfirmed=? WHERE id=?",
            [true, decoded.id],
            (error, results) => {
              if (error) return next(error);
              // const token = generateAuthToken(user, config.get("secretkey"));
              return res.status(200).json({
                message: "account confirmed successfully",
                data: decoded.email,
              });
            }
          );
        } else if (req.body.data == "account/resetpassword") {
          return res.status(200).json({
            message: "Your email has been verified successfully",
            data: decoded.email,
          });
        } else {
          res.status(500).json({
            message: "Something is not right! ",
          });
        }
      }
    );
  });
});

module.exports = router;
