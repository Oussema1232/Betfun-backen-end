const express = require("express");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");
const _ = require("lodash");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");

const router = express.Router();

router.put("/:id", [auth, upload], async (req, res, next) => {
  if (!req.params.id == req.user.id)
    return res.status(403).send("access forbidden!");

  let profileimgURL = req.user.imgURL;
  if (req.file.path) {
    try {
      await cloudinary.uploader.upload(req.file.path).then((result) => {
        profileimgURL = result.url;
      });
    } catch (err) {
      next(err);
    }
    connexion.query(
      `SELECT imgURL from users WHERE id=${req.user.id};UPDATE users SET email=?,username=?,birthdate=?,imgURL=? WHERE id=?`,
      [
        req.body.email,
        req.body.username,
        req.body.birthdate,
        profileimgURL,
        req.user.id,
      ],
      async (err, results) => {
        if (err) {
          if (profileimgURL != "url par defaut") {
            await cloudinary.uploader.destroy(
              profileimgURL.slice(
                profileimgURL.lastIndexOf("/") + 1,
                profileimgURL.lastIndexOf(".")
              )
            );
          }

          return next(err);
        }
        if (results.affectedRows) {
          if (results[0].imgURL != "url par defaut") {
            await cloudinary.uploader.destroy(
              results[0].imgURL.slice(
                results[0].imgURL.lastIndexOf("/") + 1,
                results[0].imgURL.lastIndexOf(".")
              )
            );
          }
          return res.status(200).send("updated successfully");
        }
      }
    );
  }
});

module.exports = router;
