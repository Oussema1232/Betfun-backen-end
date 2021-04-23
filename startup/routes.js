const express = require("express");
const params = require("../routes/param");
const leagues = require("../routes/league");
const seasons = require("../routes/seasons");
const betdomains = require("../routes/betdomains");
const userdomains = require("../routes/userdomains");
const leaguesgenres = require("../routes/leaguesgenres");
const users = require("../routes/users");
const bets = require("../routes/bets");
const levels = require("../routes/levels");
const gameweeks = require("../routes/gameweeks");
const titles = require("../routes/titles");
const betdetails = require("../routes/betdetails");
const calendar = require("../routes/calendar");
const auth = require("../routes/auth");
const home = require("../routes/home");
const points = require("../routes/points");
const countries = require("../routes/countries");
const teams = require("../routes/teams");
const confirmmail = require("../routes/confirmmail");
const sendverificationmail = require("../routes/sendverificationmail");
const emailresetverification = require("../routes/emailresetverification");
const resetpassword = require("../routes/resetpassword");

const domainstats = require("../routes/domainstats");
const knowledgestats = require("../routes/knowledgestats");
const quotes = require("../routes/quotes");
const informations = require("../routes/informations");
const questions = require("../routes/questions");
const difficulties = require("../routes/difficulties");
const categories = require("../routes/categories");
const suggestions = require("../routes/suggestions");
const round = require("../routes/round");
const error = require("../middleware/error");
var cors = require("cors");
module.exports = function (app) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content, Accept, Content-Type,append,delete,entries,foreach,get,has,keys,set,values,x-auth-token, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
  });
  app.use(cors());
  app.options("*", cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use("/api/leagues", leagues);
  app.use("/api/seasons", seasons);
  app.use("/api/teams", teams);
  app.use("/api/betdomains", betdomains);
  app.use("/api/userdomains", userdomains);
  app.use("/api/leaguesgenres", leaguesgenres);
  app.use("/api/confirmation", confirmmail);
  app.use("/api/loginconfirmation", sendverificationmail);
  app.use("/api/checkemail", emailresetverification);
  app.use("/api/resetpassword", resetpassword);
  app.use("/api/params", params);
  app.use("/api/calendar", calendar);
  app.use("/api/gameweeks", gameweeks);
  app.use("/api/bets", bets);
  app.use("/api/levels", levels);
  app.use("/api/titles", titles);
  app.use("/api/betdetails", betdetails);
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/api/points", points);
  app.use("/api/countries", countries);
  app.use("/api/quotes", quotes);
  app.use("/api/questions", questions);
  app.use("/api/difficulties", difficulties);
  app.use("/api/informations", informations);
  app.use("/api/categories", categories);
  app.use("/api/suggestions", suggestions);
  app.use("/api/round", round);
  app.use("/api/domainstats", domainstats);
  app.use("/api/knowledgestats", knowledgestats);
  app.use("/", home);
  app.use(error);
};
