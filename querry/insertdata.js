const connexion = require("../startup/database");

module.exports = function (tablename, data) {
  connexion.query(`INSERT INTO ${tablename} SET`, data, function (
    err,
    results
  ) {
    if (err) console.log(err.message);
    return results.insertId;
  });
};
