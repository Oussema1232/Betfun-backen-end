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
router.post("/", (req, res, next) => {
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

  // send mail with defined transport object

  connexion.query(
    `SELECT * FROM users WHERE email=?`,
    req.body.email,
    function (err, results) {
      if (err) return next(err);

      if (results[0])
        return res.status(400).send("user already registred by this email");
      connexion.query(
        `SELECT * FROM users WHERE username=?`,
        req.body.username,
        function (err, results) {
          if (err) return next(err);

          if (results[0])
            return res
              .status(400)
              .send("user already registred by this username");

          connexion.query(
            `SELECT * FROM countries WHERE id=?`,
            req.body.countryId,
            async function (err, results) {
              if (err) return next(err);

              if (!results[0]) return res.status(400).send("country not found");

              const salt = await bcrypt.genSalt(10);

              const user = {
                email: req.body.email,
                username: req.body.username,
                userpassword: await bcrypt.hash(req.body.userpassword, salt),
                countryId: req.body.countryId,
              };

              let q = `INSERT INTO users SET?`;
              connexion.query(q, user, async function (err, results) {
                if (err) return next(err);
                let userId = results.insertId;
                user.id = userId;
                const emailtoken = generateAuthToken(
                  user,
                  config.get("emailsecret")
                );
                const url = `http://localhost:3000/register/confirmation/${emailtoken}`;
                //send mail
                await transporter.sendMail(
                  {
                    from: '"BetFun" <betfuncompany@gmail.com>', // sender address
                    to: user.email, // list of receivers
                    subject: "email verification", // Subject line
                    text: "click on the link bellow", // plain text body
                    html: `Please click this link to confirm your account: <a href="${url}">${url}</a>`, // html body
                  },
                  (error, info) => {
                    if (error) {
                      return next(error);
                    }
                    res.status(200).json({ data: user, message: emailtoken });
                  }
                );
              });
            }
          );
        }
      );
    }
  );
});

//get user

router.get("/:id", (req, res, next) => {
  connexion.query(`SELECT * FROM users WHERE id=?`, req.params.id, function (
    err,
    results
  ) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("user not found under this id");
    res.status(200).send(_.omit(results[0], ["userpassword"]));
  });
});

//delete user for Admin
router.delete("/adminuser/:id", [auth, authoriz], (req, res, next) => {
  connexion.query(`SELECT * FROM users WHERE id=?`, req.params.id, function (
    err,
    results
  ) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("user not found under this id");
    connexion.query(`DELETE FROM users WHERE id=?`, results[0].id, function (
      err,
      results
    ) {
      if (err) return next(err);
      if (results) return res.status(200).send("user successfully deleted");
    });
  });
});

//delete your account
router.delete("/:id", auth, (req, res, next) => {
  if (req.params.id !== req.user.id)
    return res.status(403).send("access forbidden!");
  connexion.query(`SELECT * FROM users WHERE id=?`, req.params.id, function (
    err,
    results
  ) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("user not found under this id");
    connexion.query(`DELETE FROM users WHERE id=?`, results[0].id, function (
      err,
      results
    ) {
      if (err) return next(err);
      if (results) return res.status(200).send("user successfully deleted");
    });
  });
});

module.exports = router;
