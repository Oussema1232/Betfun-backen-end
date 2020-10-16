const _ = require("lodash");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");


router.put("/:id", auth, (req, res) => {
    if (!req.params.id == req.user.id)
      return res.status(403).send("access forbidden!");

      
  
    connexion.query(
      `UPDATE users SET email=?,username=?,birthdate=?,imgURL=? WHERE id=?`,
      [
        req.body.email,
        req.body.username,
        req.body.birthdate,
        req.body.imgURL,
        req.user.id,
      ],
      function (err, results) {
        if (err) console.log(err.message);
        if (results.affectedRows)
          return res.status(200).send("updated successfully");
      }
    );
  });
  