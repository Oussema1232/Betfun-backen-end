const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const express = require("express");
const config = require("config");
const _ = require("lodash");
const generateAuthToken = require("../token/createtoken");
const connexion = require("../startup/database");
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
      pass: config.get("emailpassword"),
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
      console.log(results);
      console.log(req.body.email);
      if (results[0])
        return res.status(400).json({ message: "email already exists" });
      connexion.query(
        `SELECT * FROM users WHERE username=?`,
        req.body.username,
        function (err, results) {
          if (err) return next(err);
          console.log(results);
          console.log(req.body.username);
          if (results[0])
            return res.status(400).json({ message: "username already exists" });

          connexion.query(
            `SELECT * FROM countries WHERE id=?`,
            req.body.countryId,
            async function (err, results) {
              if (err) return next(err);
              console.log(results);
              console.log(req.body.countryId);
              if (!results[0])
                return res.status(400).json({ message: "country not found" });

              connexion.query(
                "SELECT * FROM betfun_domains WHERE id=?",
                req.body.domainId,
                async (error, result) => {
                  if (error) return next(error);
                  if (!result[0])
                    return res
                      .status(400)
                      .json({ message: "domain not found" });
                  if (req.body.gender != "Female" && req.body.gender != "Male")
                    return res.status(400).json({ message: "invalid gender" });
                  const salt = await bcrypt.genSalt(10);

                  const user = {
                    email: req.body.email,
                    username: req.body.username,
                    userpassword: await bcrypt.hash(
                      req.body.userpassword,
                      salt
                    ),
                    countryId: req.body.countryId,
                    gender: req.body.gender,
                  };

                  let q = `INSERT INTO users SET?`;

                  connexion.beginTransaction(function (err) {
                    if (err) {
                      return next(err);
                    }
                    connexion.query(q, user, async function (err, results) {
                      if (err) {
                        return connexion.rollback(function () {
                          return next(err);
                        });
                      }
                      let userId = results.insertId;
                      user.id = userId;
                      const emailtoken = generateAuthToken(
                        user,
                        config.get("emailsecret"),
                        "1d"
                      );
                      const userDomain = {
                        userId: userId,
                        domainId: req.body.domainId,
                      };
                      connexion.query(
                        "INSERT INTO user_domains SET?",
                        userDomain,
                        (err, results) => {
                          if (err) {
                            return connexion.rollback(function () {
                              return next(err);
                            });
                          }
                          connexion.query(
                            "SELECT * FROM leagues WHERE domainId=? AND countryId=?",
                            [req.body.domainId, req.body.countryId],
                            (err, result) => {
                              if (err) {
                                return connexion.rollback(function () {
                                  return next(err);
                                });
                              }
                              let q = "select 1 ";
                              if (result[0])
                                q = "INSERT into user_league SET ?";
                              connexion.query(
                                q,
                                {
                                  userId,
                                  leagueId: result[0] ? result[0].id : 0,
                                },
                                (err, result) => {
                                  if (err) {
                                    return connexion.rollback(function () {
                                      return next(err);
                                    });
                                  }
                                  connexion.commit(async function (err) {
                                    if (err) {
                                      return connexion.rollback(function () {
                                        return next(err);
                                      });
                                    }
                                    const url = `https://betfun.herokuapp.com/register/confirmation/${emailtoken}`;
                                    //send mail
                                    await transporter.sendMail(
                                      {
                                        from:
                                          '"BetFun" <betfuncompany@gmail.com>', // sender address
                                        to: user.email, // list of receivers
                                        subject: "email verification", // Subject line
                                        text: "click on the link bellow", // plain text body
                                        html: `
                    
                          <div
                            style="
                              width: 450px;
                              margin-left:20%;
                              background-color: #fbfbfb;
                             
                              box-sizing:border-box;
                              padding: 20px;
                              border:2px solid #d4d4d3;
                              border-radius: 3px;
                              box-shadow: 0px 0px 3px 4px #d4d4d3;
                            "
                          >
                            <div
                              style="
                                font-size: 18px;
                                color: #171717;
                                border-bottom: 2px solid #d4d4d3;
                                padding: 10px;
                                width: 95%;
                                
                              "
                            >
                              Welcome ${user.username}, We bet that you want to confirm your account to join
                              us..okay then
                            </div>
                            <h2 style="width:95%;color:#171717">You may click on the button below to log into Betfun</h2>
                            <a
                              style="
                                text-decoration: none;
                                
                                display: inline-block;
                                color: #fbfbfb;
                                width: 95%;
                                height: 30px;
                                    text-align:center;
                                    padding-top:15px;      
                                    padding-bottom:15px;      
                                
                                margin-top: 25px;
                                border: 5px solid #f9a828;
                                border-radius: 3px;
                                background-color: #07617d;
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
                                        res.status(200).json({
                                          data: user,
                                          message: emailtoken,
                                        });
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
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

//get user

router.get("/:id", auth, (req, res, next) => {
  connexion.query(
    `SELECT * FROM users WHERE id=?`,
    req.params.id,
    function (err, results) {
      if (err) return next(err);

      if (!results[0])
        return res.status(400).send("Bettor not found under this id");
      res.status(200).send(_.omit(results[0], ["userpassword"]));
    }
  );
});

module.exports = router;
