const mysql = require("mysql");
const config = require("config");
module.exports = mysql.createConnection(config.get("dbinfo"));
