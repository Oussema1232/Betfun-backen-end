const express = require("express");
const connexion = require("../startup/database");
const router = express.Router();
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");

router.get("/", (req, res, next) => {
  connexion.query(`SELECT * FROM countries`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("There are no countries available");
    res
      .status(200)
      .json({ data: results, message: "Countries loaded successfully" });
  });
});

//Admin
// add new country
router.post("/", [auth, authoriz, upload], async (req, res, next) => {
  if (!req.body.name)
    return res.status(400).json({ message: "name of coutry is required" });
  if (!req.file)
    return res.status(400).json({ message: "logo of coutry is required" });
  connexion.query(
    "SELECT * FROM countries WHERE name=?",
    req.body.name,
    async (error, result) => {
      if (error) return next(error);
      if (result[0])
        return res.status(400).json({ message: "country already exist" });
      let logo = "";
      try {
        await cloudinary.uploader.upload(req.file.path).then((result) => {
          logo = result.url;
        });
      } catch (err) {
        return next(err);
      }
      const newCountry = {
        name: req.body.name,
        logo,
      };
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(
          "INSERT INTO countries SET ?",
          newCountry,
          (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            let countryId = result.insertId;
            let q = `
              SELECT * FROM betfun_domains
              LEFT JOIN (SELECT * FROM domain_seasonstatus WHERE isfinished=false) domains
              ON betfun_domains.id=domainId
              `;
            connexion.query(
              "SELECT * FROM leagues_genres WHERE name='Global'",
              (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                let genreId = result[0].id;
                connexion.query(q, (error, result) => {
                  if (error) {
                    return connexion.rollback(function () {
                      return next(error);
                    });
                  }
                  let q = "select 1 ;";
                  if (result[0]) {
                    for (let i = 0; i < result.length; i++) {
                      q += `
                              INSERT INTO leagues(name,domainId,seasonId,countryId,genreId)
                              VALUES("${req.body.name}",${result[i].id},${result[i].seasonId},${countryId},${genreId});
                              `;
                    }
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
                        .json({ message: "country created successfully" });
                    });
                  });
                });
              }
            );
          }
        );
      });
    }
  );
});

//update country
router.put("/:countryId", [auth, authoriz, upload], (req, res, next) => {
  connexion.query(
    "SELECT * FROM countries WHERE id=?",
    req.params.countryId,
    async (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "country not found" });
      let country = result[0];
      let logo = result[0].logo;
      let name = req.body.name || result[0].name;
      if (req.file) {
        try {
          await cloudinary.uploader.upload(req.file.path).then((result) => {
            logo = result.url;
          });
        } catch (err) {
          return next(err);
        }
      }
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(
          "UPDATE countries SET name=? , logo=? WHERE id=?",
          [name, logo, req.params.countryId],
          async (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            if (req.file && logo != country.logo) {
              await cloudinary.uploader.destroy(
                country.logo.slice(
                  country.logo.lastIndexOf("/") + 1,
                  country.logo.lastIndexOf(".")
                )
              );
            }
            connexion.query(
              "UPDATE leagues SEt name=? WHERE countryId=?",
              [name, req.params.countryId],
              (error, result) => {
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
                    .json({ message: "country updated successfully" });
                });
              }
            );
          }
        );
      });
    }
  );
});

//delete country
router.delete("/:countryId", [auth, authoriz, upload], (req, res, next) => {
  connexion.query(
    "SELECT * FROM countries WHERE id=?",
    req.params.countryId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "country not found" });
      let logo = result[0].logo;
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(
          "DELETE FROM countries WHERE id=?",
          req.params.countryId,
          (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            connexion.query(
              "DELETE FROM leagues WHERE countryId=?",
              req.params.countryId,
              async (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                try {
                  await cloudinary.uploader.destroy(
                    logo.slice(logo.lastIndexOf("/") + 1, logo.lastIndexOf("."))
                  );
                } catch (err) {
                  return next(error);
                }
                connexion.commit(function (err) {
                  if (err) {
                    return connexion.rollback(function () {
                      return next(err);
                    });
                  }
                  return res
                    .status(200)
                    .json({ message: "country deleted successfully" });
                });
              }
            );
          }
        );
      });
    }
  );
});

module.exports = router;
