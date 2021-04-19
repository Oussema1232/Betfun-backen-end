const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");

const router = express.Router();

//get levels

router.get("/", auth, (req, res, next) => {
  connexion.query("SELECT id,name,logo FROM levels", (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).send("There are no levels available");
    return res
      .status(200)
      .json({ data: result, message: "levels loaded successfully" });
  });
});

//get levels of specific domains

router.get("/:domainId", auth, (req, res, next) => {
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Domain not found" });
      let domainName = result[0].domainname.split(" ").join("");
      connexion.query("SELECT * FROM levels", (error, result) => {
        if (error) return next(error);
        let levels = result.filter((el) =>
          el.hasOwnProperty(`${domainName}startpoints`)
        );
        if (!levels[0])
          return res
            .status(400)
            .json({ message: "There are no levels available" });
        return res.status(200).json({
          data: result,
          message: "levels loaded successfully",
          domainname: domainName,
        });
      });
    }
  );
});

//create level
router.post("/", [auth, authoriz, upload], (req, res, next) => {
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
});

//update level
router.put(
  "/update/:levelId",
  [auth, authoriz, upload],
  async (req, res, next) => {
    connexion.query(
      "SELECT * FROM levels WHERE id=? ",
      req.params.levelId,
      async (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "level not found" });
        let level = result[0];
        let logo = level.logo;
        if (req.file) {
          try {
            await cloudinary.uploader.upload(req.file.path).then((result) => {
              logo = result.url;
            });
          } catch (err) {
            return next(err);
          }
        }
        let name = req.body.name ? req.body.name : level.name;
        let q = `
        UPDATE levels SET
        name="${name}",
        logo="${logo}"
        WHERE id=${req.params.levelId}
        `;
        connexion.query(q, async (error, result) => {
          if (error) return next(error);
          if (req.file && logo != level.logo) {
            try {
              await cloudinary.uploader.destroy(
                level.logo.slice(
                  level.logo.lastIndexOf("/") + 1,
                  level.logo.lastIndexOf(".")
                )
              );
            } catch (err) {
              return next(error);
            }
          }
          return res
            .status(200)
            .json({ message: "level updated successfully" });
        });
      }
    );
  }
);

//update levels of specific domain
router.put("/:domainId", [auth, authoriz], (req, res, next) => {
  if (!req.body.levels) return res.status(400).send("levels is required");
  let levels = req.body.levels;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0]) return res.status(400).send("domain not found");
      var domain = result[0].domainname.split(" ").join("");
      connexion.query("SELECT * FROM levels", (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).send("There are no levels available");
        let q = "";
        for (let i = 0; i < levels.length; i++) {
          let level = result.filter((el) => el.id == levels[i].id);
          if (level.length == 0)
            return res.status(400).json({ message: "levels is invalid1" });
          if (!levels[i].hasOwnProperty(`${domain}startpoints`))
            return res.status(400).json({ message: "levels is invalid2" });
          if (!levels[i].hasOwnProperty(`${domain}endpoints`))
            return res.status(400).json({ message: "levels is invalid3" });
          q += `
                UPDATE levels 
                SET ${domain}startpoints=${levels[i][`${domain}startpoints`]} ,
                    ${domain}endpoints=${levels[i][`${domain}endpoints`]}
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

//delete level
router.delete("/:levelId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * FROM levels WHERE id=?",
    req.params.levelId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "level not found" });
      let logo = result[0].logo;
      connexion.query(
        "DELETE FROM levels WHERE id=?",
        req.params.levelId,
        async (error, result) => {
          if (error) return next(error);
          try {
            await cloudinary.uploader.destroy(
              logo.slice(logo.lastIndexOf("/") + 1, logo.lastIndexOf("."))
            );
          } catch (err) {
            return next(error);
          }
          return res
            .status(200)
            .json({ message: "level deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
