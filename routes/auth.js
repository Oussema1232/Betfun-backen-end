const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const generateAuthToken = require("../token/createtoken");
const connexion = require("../startup/database");
const config = require("config");
const router = express.Router();

//auth
router.post("/", (req, res, next) => {
  connexion.query(
    `SELECT * FROM users WHERE email=?`,
    req.body.email,
    async function (err, results) {
      if (err) return next(err);

      if (!results[0]) return res.status(400).send("invalid email or password");

      try {
        const validpassword = await bcrypt.compare(
          req.body.userpassword,
          results[0].userpassword
        );
        if (!validpassword)
          return res.status(400).send("invalid email or password");

        if (!results[0].isConfirmed) {
          const emailtoken = generateAuthToken(
            results[0],
            config.get("emailsecret")
          );

          return res
            .status(403)
            .json({ data: emailtoken, message: "Account not confirmed" });
        }

        const token = generateAuthToken(results[0], config.get("secretkey"));
        

        return res
          .header("x-auth-token", token)
          .header("access-control-expose-headers", "x-auth-token")
          .json({
            token: token,
            currentUser: _.omit(results[0], ["userpassword"]),
            message: "Welcome",
          });
      } catch (err) {
        return next(err);
      }
    }
  );
});

module.exports = router;
