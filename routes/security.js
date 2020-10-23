const _ = require("lodash");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

router.put("/:id", auth, (req, res, next) => {
  if (!req.params.id == req.user.id)
    return res.status(403).send("access forbidden!");

  connexion.query(
    `UPDATE users SET private=?,blockmessages=? WHERE userId=?`,
    [req.body.private, req.body.blockmessages, req.body.userId],
    function (err, results) {
      if (err) return next(err);
      if (results.affectedRows)
        return res.status(200).send("updated successfully");
    }
  );
});

router.get("/:id", auth, (req, res, next) => {
  if (!req.params.id == req.user.id)
    return res.status(403).send("access forbidden!");

  connexion.query(`SELECT * FROM security_settings`, function (err, results) {
    if (err) return next(err);
    if (results.affectedRows) return res.status(200).send(results);
  });
});
