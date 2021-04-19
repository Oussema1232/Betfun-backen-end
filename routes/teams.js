const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const cloudinary = require("../startup/cloudinaryconfig");
const upload = require("../middleware/multer");
const moment = require("moment");

const router = express.Router();

router.get("/:domainId", [auth, authoriz], (req, res, next) => {
  const q = `
    SELECT * from teams Where domainId=?;
    `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      connexion.query(q, req.params.domainId, (error, result) => {
        if (error) return next(error);
        return res.status(200).json({ message: "teams", data: result });
      });
    }
  );
});

// add new team
router.post("/", [auth, authoriz, upload], async (req, res, next) => {
  let date = new Date().toUTCString();
  console.log("UTC Date: " + date); // UTC Date: Thu, 27 Jun 2019 07:50:46 GMT

  let localDate = moment(date).local(true).format("YYYY-MM-DD HH:mm:ss");
  console.log("Moment Local Date: " + localDate);

  if (!req.body.name) {
    console.log("name");
    return res.status(400).json({ message: "name of team is required" });
  }
  
  if (!req.body.domainId) {
    console.log("domain");
    return res.status(400).json({ message: "domainId is required" });
  }
  if (!req.file) {
    console.log("file");
    return res.status(400).json({ message: "logo of team is required" });
  }
  let logo = "";
  try {
    await cloudinary.uploader.upload(req.file.path).then((result) => {
      logo = result.url;
    });
  } catch (err) {
    return next(err);
  }
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.body.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "domain not found" });
      const newTeam = {
        name: req.body.name,
        logo,
        domainId: req.body.domainId,
      };
      connexion.query("INSERT INTO teams SET ?", newTeam, (error, result) => {
        if (error) return next(error);
        return res.status(200).json({ message: "team created successfully" });
      });
    }
  );
});

//update team
router.put("/:teamId", [auth, authoriz, upload], async (req, res, next) => {
  connexion.query(
    "SELECT * FROM teams WHERE id=? ",
    req.params.teamId,
    async (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "team not found" });
      let team = result[0];
      let logo = team.logo;
      if (req.file) {
        try {
          await cloudinary.uploader.upload(req.file.path).then((result) => {
            logo = result.url;
          });
        } catch (err) {
          return next(err);
        }
      }
      let name = req.body.name || team.name;
      let plays = req.body.plays || team.plays;
      let domainId = req.body.domainId || team.domainId;
      let website = req.body.website || team.website;
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });

          if (
            plays != "true" &&
            plays != "false" &&
            plays != "1" &&
            plays != "0"
          ) {
            console.log("plays", typeof plays);
            return res.status(400).json({ message: "plays should be boolean" });
          }
          let q = `
            UPDATE teams
            SET name="${name}",
            logo="${logo}",
            website="${website}",
            plays=${plays},
            domainId=${domainId}
            WHERE id=${team.id}
            `;
          connexion.query(q, async (error, result) => {
            if (error) return next(error);
            if (req.file && logo != team.logo) {
              await cloudinary.uploader.destroy(
                team.logo.slice(
                  team.logo.lastIndexOf("/") + 1,
                  team.logo.lastIndexOf(".")
                )
              );
            }
            return res
              .status(200)
              .json({ message: "team updated successfully" });
          });
        }
      );
    }
  );
});

//delete team
router.delete("/:teamId", [auth, authoriz, upload], (req, res, next) => {
  connexion.query(
    "SELECT * FROM teams WHERE id=? ",
    req.params.teamId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "team not found" });
      let logo = result[0].logo;
      connexion.query(
        "DELETE FROM teams WHERE id=?",
        req.params.teamId,
        async (error, result) => {
          if (error) return next(error);
          try {
            await cloudinary.uploader.destroy(
              logo.slice(logo.lastIndexOf("/") + 1, logo.lastIndexOf("."))
            );
          } catch (err) {
            return next(error);
          }
          return res.status(200).json({ message: "team deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
