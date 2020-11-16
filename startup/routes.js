const express = require("express");
const params = require("../routes/param");
const leagues = require("../routes/league");
const users = require("../routes/users");
const bets = require("../routes/bets");
const calendar = require("../routes/calendar");
const auth = require("../routes/auth");
const home = require("../routes/home");
const points = require("../routes/points");
const ranks = require("../routes/ranks");
const countries = require("../routes/countries");
const confirmmail = require("../routes/confirmmail");
const sendverificationmail = require("../routes/sendverificationmail");
const emailresetverification = require("../routes/emailresetverification");
const resetpassword = require("../routes/resetpassword");
const error = require("../middleware/error");

module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use("/api/leagues", leagues);
  app.use("/api/confirmation", confirmmail);
  app.use("/api/loginconfirmation", sendverificationmail);
  app.use("/api/checkemail", emailresetverification);
  app.use("/api/resetpassword", resetpassword);
  app.use("/api/params", params);
  app.use("/api/calendar", calendar);
  app.use("/api/ranks", ranks);
  app.use("/api/bets", bets);
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/api/points", points);
  app.use("/api/countries", countries);
  app.use("/", home);
  app.use(error);
};
