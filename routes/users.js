const bcrypt = require("bcrypt");
const express = require("express");
const _ = require("lodash");
const generateAuthToken = require("../token/createtoken");
const connexion = require("../startup/database");
const authoriz = require("../middleware/authoriz");
const auth = require("../middleware/auth");

const router = express.Router();

//create user
router.post("/", async (req, res, next) => {
  connexion.query(
    `SELECT * FROM users WHERE email=?`,
    req.body.email,
    function (err, results) {
      if (err) return next(err);

      if (results[0])
        return res.status(400).send("user already registred by this email");
    }
  );
  // const existemail = verify("email", req.body.email, "users", "email");
  // if (existemail)

  connexion.query(
    `SELECT * FROM users WHERE username=?`,
    req.body.username,
    function (err, results) {
      if (err) return next(err);

      if (results[0])
        return res.status(400).send("user already registred by this username");
    }
  );

  connexion.query(
    `SELECT * FROM countries WHERE id=?`,
    req.body.countryId,
    function (err, results) {
      if (err) return next(err);

      if (!results[0])
        return res
          .status(400)
          .send("the country with the requested id was not found");
    }
  );

  const salt = await bcrypt.genSalt(10);

  const user = {
    email: req.body.email,
    username: req.body.username,
    userpassword: await bcrypt.hash(req.body.userpassword, salt),
    countryId: req.body.countryId,
  };

  let q = `INSERT INTO users SET?`;
  connexion.query(q, user, function (err, results) {
    if (err) return next(err);
    let userId = results.insertId;
    user.id = userId;
  });

  const token = generateAuthToken(user);
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["id", "username", "email", "imgURL"]));
});

//get user

router.get("/:id", auth, (req, res, next) => {
  connexion.query(`SELECT * FROM users WHERE id=?`, req.params.id, function (
    err,
    results
  ) {
    if (err) return next(err);

    if (!results) return res.status(400).send("user not found under this id");
    res.status(200).send(_.omit(results[0], ["userpassword"]));
  });
});

//delete user
router.delete("/:id", [auth, authoriz], (req, res, next) => {
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
