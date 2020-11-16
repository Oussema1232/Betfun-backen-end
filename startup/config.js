const config = require("config");

module.exports = function () {
  if (!config.get("secretkey")) {
    console.log("FATAL ERROR: secretkey is not defined ");
    process.exit(1);
  } else if (!config.get("emailsecret")) {
    console.log("FATAL ERROR: emailsecret is not defined ");
    process.exit(1);
  }
};
