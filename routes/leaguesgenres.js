const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

//get genres

router.get("/",auth, (req, res, next) => {
  connexion.query("SELECT * FROM leagues_genres", (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({ message: "There are no genres available" });
    return res.status(200).json({ message: "genres", data: result });
  });
});

//create new genres
router.post("/", 
[auth, authoriz],
 (req, res, next) => {
  if (!req.body.name)
    return res.status(400).json({ message: "name is required" });
  connexion.query(
    "SELECT * FROM leagues_genres WHERE name=?",
    req.body.name,
    (error, result) => {
      if (error) return next(error);
      if (result[0])
        return res.status(400).json({ message: "genre already exist" });
      connexion.query(
        "INSERT INTO leagues_genres SET ?",
        { name: req.body.name },
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "genre created successfully" });
        }
      );
    }
  );
});

//update genre
router.put("/:genreId", 
[auth, authoriz],
 (req, res, next) => {
  if (!req.body.name)
    return res.status(400).json({ message: "name is required" });
  connexion.query(
    "SELECT * FROM leagues_genres WHERE id=?",
    req.params.genreId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "genre not found" });
      let q = `
        UPDATE leagues_genres SET
            name=?
        WHERE id=? ;
        `;
      connexion.query(
        q,
        [req.body.name, req.params.genreId],
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "genre updated successfully" });
        }
      );
    }
  );
});

//delete genre
router.delete("/:genreId",
 [auth, authoriz],
  (req, res, next) => {
  connexion.query(
    "SELECT * FROM leagues_genres WHERE id=?",
    req.params.genreId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "genre not found" });
      connexion.query(
        "DELETE FROM leagues_genres WHERE id=?",
        req.params.genreId,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "genre deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
