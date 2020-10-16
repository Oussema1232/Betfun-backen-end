const express = require("express");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");
const _ = require("lodash");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

router.put("/:id", [auth, upload], async (req, res) => {
  if (!req.params.id == req.user.id)
    return res.status(403).send("access forbidden!");

  let profileimgURL = req.user.imgURL;
  if (req.file.path) {
    try {
      await cloudinary.uploader.upload(req.file.path).then((result) => {
        if (result) profileimgURL = result.url;
      });
    } catch (err) {
      console.log(err);
    }
  }

  connexion.query(
    `UPDATE users SET email=?,username=?,birthdate=?,imgURL=? WHERE id=?`,
    [
      req.body.email,
      req.body.username,
      req.body.birthdate,
      profileimgURL,
      req.user.id,
    ],
    function (err, results) {
      if (err) console.log(err.message);
      if (results.affectedRows)
        return res.status(200).send("updated successfully");
    }
  );
});

module.exports = router;
