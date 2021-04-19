const jwt = require("jsonwebtoken");
const _ = require("lodash");

module.exports = function (user, secretcode, expiresIn) {
  let userdata = _.pick(user, [
    "id",
    "username",
    "email",
    "isAdmin",
    "countryId",
    "language",
    "gender"
    
  ]);
  return expiresIn
    ? jwt.sign(userdata, secretcode, { expiresIn })
    : jwt.sign(userdata, secretcode);
};
