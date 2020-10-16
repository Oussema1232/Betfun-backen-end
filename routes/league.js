const express = require("express");
const shortid = require("shortid");
const verify = require("../querry/getdata");
const insert = require("../querry/insertdata");
const deletedata = require("../querry/deletedata");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

// create league
//transaction
router.post("/", (req, res) => {
  if (!req.body.name) return res.status(400).send("must insert league name");
  const code = shortid.generate();
  let newLeague = {
    name: req.body.name,
    code: code,
  };
  connexion.beginTransaction(function (err) {
    if (err) {
      throw err;
    }
    connexion.query("INSERT INTO leagues SET?", newLeague, function (
      error,
      results,
      fields
    ) {
      if (error) {
        return connexion.rollback(function () {
          throw error;
        });
      }

      let newUserLeague = {
        userId: req.body.userId,
        leagueId: results.insertId,
      };

      connexion.query("INSERT INTO user_league SET?", newUserLeague, function (
        error,
        results,
        fields
      ) {
        if (error) {
          return connexion.rollback(function () {
            throw error;
          });
        }

        connexion.commit(function (err) {
          if (err) {
            return connexion.rollback(function () {
              throw err;
            });
          }
          res.status(200).send(code);
        });
      });
    });
  });
});

//join league
router.post("/:id", auth, (req, res) => {
  const verifyleague = verify("name", req.params.id, "leagues", "id");
  if (!verifyleague)
    return send.status(404).send("league not found under this id");

  const league = verify("*", req.body.code, "leagues", "code");

  if (!league) return res.status(400).json({ error: "code incorrect !" });
  const newUserLeague = {
    userId: req.body.userId,
    leagueId: league.id,
  };

  const insertId = insert("user_league", newUserLeague);
  if (insertId) res.status(200).send("You have joined successfully");
});

//delete league

router.delete("/:id", [auth, authoriz], (req, res) => {
  const league = verify("leagueId", "leagues", req.params.id);
  if (!league) return send.status(404).send("league not found under this id");

  const numrowsdeleted = deletedata("leagues", "id", req.params.id);

  if (numrowsdeleted) return res.status(200).send(numrowsdeleted);
});

module.exports = router;
