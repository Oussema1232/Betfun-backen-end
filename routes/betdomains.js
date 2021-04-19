const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");
const router = express.Router();

router.get("/",  (req, res, next) => {
  connexion.query(
    `SELECT id, domainname as name, logo FROM betfun_domains`,
    function (err, results) {
      if (err) return next(err);

      if (!results[0])
        return res
          .status(400)
          .json({ message: "There are no domains available" });
      res
        .status(200)
        .json({ data: results, message: "domains loaded successfully" });
    }
  );
});

//get domains of specific season

router.get("/:seasonId", auth, (req, res, next) => {
  const q = `SELECT betfun_domains.id as id, domainname  FROM betfun_domains
              JOIN domain_seasonstatus
              ON domain_seasonstatus.domainId=betfun_domains.id
              WHERE seasonId=?
              `;
  connexion.query(
    `SELECT * FROM seasons WHERE id=?`,
    req.params.seasonId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "This season is not available" });
      connexion.query(q, req.params.seasonId, (error, results) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ data: results, message: "domains loaded successfully" });
      });
    }
  );
});

//admin
//add domain
router.post("/", [auth, authoriz, upload], async (req, res, next) => {
  if (!req.body.domainname)
    return res.status(400).json({ message: "domainname is required" });
  if (!req.file) return res.status(400).json({ message: "logo is required" });

  let logo = "";
  try {
    await cloudinary.uploader.upload(req.file.path).then((result) => {
      logo = result.url;
    });
  } catch (err) {
    return next(err);
  }
  const newDomain = {
    domainname: req.body.domainname,
    logo,
  };
  connexion.beginTransaction((err) => {
    if (err) {
      return next(err);
    }
    connexion.query(
      "INSERT INTO betfun_domains SET ?",
      newDomain,
      (error, result) => {
        if (error) {
          return connexion.rollback(function () {
            return next(error);
          });
        }
        let domainId = result.insertId;
        connexion.query(
          "SELECT * FROM leagues_genres WHERE name='Global'",
          (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            let genreId = result[0].id;
            connexion.query("SELECT * FROM countries", (error, result) => {
              if (error) {
                return connexion.rollback(function () {
                  return next(error);
                });
              }
              let q = "SELECT 1;";
              if (result[0]) {
                for (let i = 0; i < result.length; i++) {
                  q += `
                          INSERT INTO leagues (name,domainId,countryId,genreId)
                          VALUES("${result[i].name}",${domainId},${result[i].id},${genreId});
                      `;
                }
              }
              connexion.query(q, (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                let domainname = req.body.domainname.split(" ").join("");
                let q = `
                      ALTER TABLE levels ADD ${domainname}startpoints INT;
                      ALTER TABLE levels ADD ${domainname}endpoints INT;
                      `;
                let levels = req.body.levels;
                for (let i; i < levels; i++) {
                  q += `
                          UPDATE levels 
                          SET ${domainname}startpoints=${levels[i].startpoints},
                              ${domainname}endpoints=${levels[i].endpoints}
                          WHERE id=${levels[i].id} ;
                          `;
                }
                connexion.query(q, (error, result) => {
                  if (error) {
                    return connexion.rollback(function () {
                      return next(error);
                    });
                  }
                  connexion.commit(function (err) {
                    if (err) {
                      return connexion.rollback(function () {
                        return next(err);
                      });
                    }
                    return res
                      .status(200)
                      .json({ message: "domain created successfully" });
                  });
                });
              });
            });
          }
        );
      }
    );
  });
});

//update domain
router.put("/:domainId", [auth, authoriz, upload], (req, res, next) => {
  connexion.query(
    "SELECT * FROM  betfun_domains WHERE id=?",
    req.params.domainId,
    async (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      let domain = result[0];
      let logo = domain.logo;
      let olddomainname = domain.domainname.split(" ").join("");
      let newdomainname = req.body.domainname || domain.domainname;

      if (req.file) {
        try {
          await cloudinary.uploader.upload(req.file.path).then((result) => {
            logo = result.url;
          });
        } catch (err) {
          return next(err);
        }
      }
      let q = `
          UPDATE betfun_domains SET domainname=? , logo=? WHERE id=?;
          ALTER TABLE levels
          CHANGE ${olddomainname}startpoints ${newdomainname
        .split(" ")
        .join("")}startpoints INT,
          CHANGE ${olddomainname}endpoints ${newdomainname
        .split(" ")
        .join("")}endpoints INT;
        `;
      connexion.query(
        q,
        [newdomainname, logo, req.params.domainId],
        async (error, result) => {
          if (error) return next(error);
          if (req.file && logo != domain.logo) {
            await cloudinary.uploader.destroy(
              domain.logo.slice(
                domain.logo.lastIndexOf("/") + 1,
                domain.logo.lastIndexOf(".")
              )
            );
          }
          return res
            .status(200)
            .json({ message: "domain updated successfully" });
        }
      );
    }
  );
});
//delete domain
router.delete("/:domainId", [auth, authoriz, upload], (req, res, next) => {
  connexion.query(
    "SELECT * FROM  betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      let domain = result[0];
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(
          "DELETE FROM betfun_domains WHERE id=?",
          req.params.domainId,
          async (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            let q = `
              ALTER TABLE levels DROP COLUMN ${domain.domainname
                .split(" ")
                .join("")}startpoints ;
              ALTER TABLE levels DROP COLUMN ${domain.domainname
                .split(" ")
                .join("")}endpoints;
              `;
            connexion.query(q, async (error, result) => {
              if (error) {
                return connexion.rollback(function () {
                  return next(error);
                });
              }
              try {
                await cloudinary.uploader.destroy(
                  domain.logo.slice(
                    domain.logo.lastIndexOf("/") + 1,
                    domain.logo.lastIndexOf(".")
                  )
                );
              } catch (err) {
                return next(err);
              }
              connexion.commit(function (err) {
                if (err) {
                  return connexion.rollback(function () {
                    return next(err);
                  });
                }
                return res
                  .status(200)
                  .json({ message: "domain deleted successfully" });
              });
            });
          }
        );
      });
    }
  );
});

module.exports = router;
