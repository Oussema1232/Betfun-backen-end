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
const error = require("../middleware/error");

module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use("/api/leagues", leagues);
  app.use("/api/params", params);
  app.use("/api/calendar", calendar);
  app.use("/api/ranks", ranks);
  app.use("/api/bets", bets);
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/api/points", points);
  app.use("/", home);
  app.use(error);
};
