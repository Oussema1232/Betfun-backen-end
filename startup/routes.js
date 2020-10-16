const express = require("express");
const params = require("../routes/param");
const leagues = require("../routes/league");
const users = require("../routes/users");
const bets = require("../routes/bets");
const calendar = require("../routes/calendar");
const teamresults = require("../routes/teamresults");
const auth = require("../routes/auth");
const home = require("../routes/home");

module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use("/api/leagues", leagues);
  app.use("/api/params", params);
  app.use("/api/calendar", calendar);
  app.use("/api/teamresults", teamresults);
  app.use("/api/bets", bets);
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/", home);
};
