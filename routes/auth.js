const bcrypt = require("bcrypt");
const express = require("express");
const generateAuthToken = require("../token/createtoken");

const router = express.Router();

//auth
router.post("/", async (req, res, next) => {
  connexion.query(
    `SELECT * FROM users WHERE email=?`,
    req.body.email,
    function (err, results) {
      if (err) return next(err);

      if (!results[0]) return res.status(400).send("invalid email or password");
    }
  );

  const validpassword = bcrypt.compare(
    req.body.userpassword,
    existuser.userpassword
  );
  if (!validpassword) res.status(400).send("invalid email or password");
  const token = generateAuthToken(user);
  res.send(token);
});

module.exports = router;
