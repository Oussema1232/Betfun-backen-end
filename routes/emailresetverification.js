const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const express = require("express");
const config = require("config");
const _ = require("lodash");
const generateAuthToken = require("../token/createtoken");
const connexion = require("../startup/database");
const authoriz = require("../middleware/authoriz");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:email", async (req, res, next) => {
  connexion.query(
    `SELECT * FROM users WHERE email=?`,
    req.params.email,
    async function (err, results) {
      if (err) return next(err);

      if (!results[0])
        return res
          .status(400)
          .json({ message: "There is no account under this email" });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",

        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP

        requireTLS: true,
        auth: {
          user: "betfuncompany@gmail.com",
          pass: "Soltan&7tombetfun1.",
        },
        tls: {
          rejectUnauthorized: false,
        },
        logger: true,
      });

      const emailtoken = generateAuthToken(
        results[0],
        config.get("emailsecret"),
        "1h"
      );

      const url = `http://localhost:3000/account/resetpassword/${emailtoken}`;
      //send mail
      await transporter.sendMail(
        {
          from: '"BetFun" <betfuncompany@gmail.com>', // sender address
          to: req.params.email, // list of receivers
          subject: "Password reset", // Subject line
          text: "click on the link bellow", // plain text body
          html: `Please click this link to reset your password: <a href="${url}">${url}</a>`, // html body
        },
        (error, info) => {
          if (error) {
            res
              .status(400)
              .json({ message: "something went wrong try again later" });
            return next(error);
          }
          return res.status(200).json({ message: "link sent successfully" });
        }
      );
    }
  );
});
module.exports = router;
