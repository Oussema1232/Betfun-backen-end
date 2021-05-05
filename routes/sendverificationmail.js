const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const express = require("express");
const config = require("config");

const router = express.Router();

//create user
router.get("/:emailtoken", (req, res, next) => {
  jwt.verify(
    req.params.emailtoken,
    config.get("emailsecret"),
    async function (err, decoded) {
      if (err) {
        if (err.message === "jwt malformed")
          return res
            .status(400)
            .json({ message: "confirmation link not valid try again later! " });
        if (err.message === "jwt expired")
          return res
            .status(400)
            .json({ message: "confirmation link expired " });

        return next(err);
      }
      let transporter = nodemailer.createTransport({
        host: "box2030.bluehost.com",

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

      const url = `https://betfun.herokuapp.com/register/confirmation/${req.params.emailtoken}`;
      //send mail
      await transporter.sendMail(
        {
          from: '"BetFun" <betfuncompany@betfun.com>', // sender address
          to: decoded.email, // list of receivers
          subject: "email verification", // Subject line
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
          Welcome ${decoded.username}, We bet that you want to confirm your account to join
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
      </div>`, // html body
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
