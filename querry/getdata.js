const connexion = require("../startup/database");

module.exports = function (data, identifiervalue, tablename, identifier) {
  connexion.query(
    `SELECT ${data} FROM ${tablename} WHERE ${identifier}=?`,
    identifiervalue,
    function (err, results) {
      if (err) console.log(err.message);
      console.log(results[0]);
      return results[0];
    }
  );
};
