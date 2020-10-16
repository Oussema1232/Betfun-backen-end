const connexion = require("../startup/database");

module.exports = function (tablename, identifiername, indentifier) {
  connexion.query(
    `DELETE FROM ${tablename} WHERE ${identifiername}=?`,
    indentifier,
    function (err, results) {
      if (err) console.log(err.message);
      return results.affectedRows;
    }
  );
};
