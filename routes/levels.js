const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");

const router = express.Router();

//create level
router.post(
  "/",
  // ,[auth,authoriz
  upload,
  // ]
  (req, res, next) => {
    if (!req.body.name)
      return res.status(400).json({ message: "name of level is required" });
    if (!req.file)
      return res.status(400).json({ message: "logo of level is required" });
    connexion.query(
      "SELECT * FROM levels WHERE name=?",
      req.body.name,
      async (error, result) => {
        if (error) return next(error);
        if (result[0])
          return res.status(400).json({ message: "level already exist" });
        let logo = "";
        try {
          await cloudinary.uploader.upload(req.file.path).then((result) => {
            logo = result.url;
            const newLevel = {
              name: req.body.name,
              logo,
            };
            connexion.query(
              "INSERT INTO levels SET ?",
              newLevel,
              (error, result) => {
                if (error) return next(error);
                return res
                  .status(200)
                  .json({ message: "level created successfully" });
              }
            );
          });
        } catch (err) {
          return next(err);
        }
      }
    );
  }
);
//get levels

router.get("/", 
// auth,
 (req, res, next) => {
  connexion.query("SELECT id,name,logo FROM levels", (error, result) => {
    if (error) return next(error);
    if (!result[0]) return res.status(400).send("the are no levels available");
    return res
      .status(200)
      .json({ data: result, message: "levels loaded successfully" });
  });
});

//get levels of specific domains

router.get("/:domainId", 
// auth,
 (req, res, next) => {
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      let domainName = result[0].domainname;
      connexion.query("SELECT * FROM levels", (error, result) => {
        if (error) return next(error);
        let levels = result.filter((el) =>
          el.hasOwnProperty(`${domainName}startpoints`)
        );
        if (!levels[0])
          return res.status(400).send("the are no levels available");
        return res
          .status(200)
          .json({ data: result, message: "levels loaded successfully" });
      });
    }
  );
});

//update levels of specific domain
router.put("/:domainId",
//  [auth, authoriz],
 (req, res, next) => {
  if (!req.body.levels) return res.status(400).send("levels is required");
  let levels = req.body.levels;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0]) return res.status(400).send("domain not found");
      let domain = result[0].domainname;
      connexion.query("SELECT * FROM levels", (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).send("the are no levels available");
        let q = "";
        if (!result[0].hasOwnProperty(`${domain}startpoints`)) {
          if (levels.length != result.length)
            return res.status(400).json({ message: "levels is invalid" });
          q += `
                ALTER TABLE levels ADD ${domain}startpoints INT;
                ALTER TABLE levels ADD ${domain}endpoints INT;
                `;
        }
        for (let i = 0; i < levels.length; i++) {
          let level = result.filter((el) => el.id == levels[i].id);
          if (level.length == 0)
            return res.status(400).json({ message: "levels is invalid" });
          if (!levels[i].hasOwnProperty(`startpoints`))
            return res.status(400).json({ message: "levels is invalid" });
          if (!levels[i].hasOwnProperty(`endpoints`))
            return res.status(400).json({ message: "levels is invalid" });
          q += `
                UPDATE levels 
                SET ${domain}startpoints=${levels[i].startpoints} ,
                    ${domain}endpoints=${levels[i].endpoints}
                WHERE id=${levels[i].id} ;
                `;
        }
        connexion.query(q, (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "levels updated successfully" });
        });
      });
    }
  );
});

module.exports = router;
