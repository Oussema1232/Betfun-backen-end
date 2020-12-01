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
                  config.get("emailsecret"),
                  "1d"
                );
                const url = `http://localhost:3000/register/confirmation/${emailtoken}`;
                //send mail
                await transporter.sendMail(
                  {
                    from: '"BetFun" <betfuncompany@gmail.com>', // sender address
                    to: user.email, // list of receivers
                    subject: "email verification", // Subject line
                    text: "click on the link bellow", // plain text body
                    html: `
                    
    <div
      style="
        width: 450px;
        margin-left:20%;
        background-color: #f5f5e5;
       
        box-sizing:border-box;
        padding: 20px;
        border:2px solid #4e0000;
        border-radius: 3px;
        box-shadow: 0px 0px 3px 4px #dddfad;
      "
    >
      <div
        style="
          font-size: 18px;
          color: #767676;
          border-bottom: 2px solid #dddddd;
          padding: 10px;
          width: 95%;
          
        "
      >
        Welcome ${user.username}, We bet that you want to confirm your account to join
        us..okay then
      </div>
      <h2 style="width:95%;color:black">You may click on the button below to log into Betfun</h2>
      <a
        style="
          text-decoration: none;
          
          display: inline-block;
          color: #070427;
          width: 95%;
          height: 30px;
              text-align:center;
              padding-top:15px;      
              padding-bottom:15px;      
          
          margin-top: 25px;
          border: 5px solid #070427;
          border-radius: 3px;
          background-color: rgba(255, 185, 82, 0.7);
          font-weight: bolder;
          font-size: 20px;
          cursor: pointer;
          user-select: none;
        "
        href="${url}"
        >Confirm Account</a
      >
    </div>
  `, // html body
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
