const jwt = require("jsonwebtoken");
const config = require("config");
const _ = require("lodash");

module.exports = function (user) {
  let userdata = _.pick(user, ["id", "username", "email", "isAdmin"]);
  return jwt.sign(userdata, config.get("secretkey"));
};
