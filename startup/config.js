const config = require("config");

module.exports = function () {
  if (!config.get("secretkey")) {
    console.log("FATAL ERROR: secretkey is not defined ");
    process.exit(1);
  }
};
