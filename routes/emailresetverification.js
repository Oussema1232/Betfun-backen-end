const nodemailer = require("nodemailer");
const express = require("express");
const config = require("config");
const _ = require("lodash");
const generateAuthToken = require("../token/createtoken");
const connexion = require("../startup/database");

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
        host: "mail.betfun.com",
        name: "mail.betfun.com",
        secureConnection: false, // TLS requires secureConnection to be false
        port: 465, // port for secure SMTP

        auth: {
          user: "betfuncompany@betfun.com",
          pass: config.get("emailpassword"),
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

      const url = `https://betfun.herokuapp.com/account/resetpassword/${emailtoken}`;
      //send mail
      await transporter.sendMail(
        {
          from: '"BetFun" <betfuncompany@betfun.com>', // sender address
          to: req.params.email, // list of receivers
          subject: "Password reset", // Subject line
          text: "click on the link bellow", // plain text body
          html: `<div
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
            Welcome ${results[0].username}, We bet that you forgot your password,okay then..
          </div>
          <h2 style="width:95%;color:#171717">You may click on the button below to reset it</h2>
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
            >Reset</a
          >
        </div>`, // html body
        },
        (error, info) => {
          if (error) {
            return next(error);
          }
          return res.status(200).json({ message: "Link sent successfully" });
        }
      );
    }
  );
});
module.exports = router;
