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

//create user
router.get("/:emailtoken", async (req, res, next) => {
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

  const url = `http://localhost:3000/register/confirmation/${req.params.emailtoken}`;
  //send mail
  await transporter.sendMail(
    {
      from: '"BetFun" <betfuncompany@gmail.com>', // sender address
      to: "oussema.ben.soltana1@gmail.com", // list of receivers
      subject: "email verification", // Subject line
      text: "click on the link bellow", // plain text body
      html: `Please click this link to confirm your account: <a href="${url}">${url}</a>`, // html body
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
});
module.exports = router;
