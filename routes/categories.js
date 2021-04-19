const express = require("express");
const connexion = require("../startup/database");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");

const router = express.Router();

//get all categories
router.get(
  "/:language",
   auth,
  (req, res, next) => {
    connexion.query("SELECT * FROM categories", (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({
          message:
            req.params.language == "Arab"
              ? "لا توجد فئات متاحة"
              : "There are no categories available",
        });
      return res.status(200).json({
        message:
          req.params.language == "Arab"
            ? "الفئات المتاحة"
            : "Categories available",
        data: result,
      });
    });
  }
);

//create category
router.post(
  "/"
  , [auth, authoriz],
  (req, res, next) => {
    if (!req.body.Engname || req.body.Engname.length == 0)
      return res.status(400).json({ message: "Engname is required" });
    if (!req.body.Arabname || req.body.Arabname.length == 0)
      return res.status(400).json({ message: "Arabname is required" });
    if (!req.body.color || req.body.color.length == 0)
      return res.status(400).json({ message: "color is required" });
    if (!req.body.delay || req.body.delay.length == 0)
      return res.status(400).json({ message: "delay is required" });
    connexion.query(
      "SELECT * FROM categories WHERE Engname=?",
      req.body.Engname,
      (error, result) => {
        if (error) return next(error);
        if (result[0])
          return res.status(400).json({ message: "category already exist" });
        const newCategory = {
          Engname: req.body.Engname,
          Arabname: req.body.Arabname,
          color: req.body.color,
          delay: req.body.delay,
        };
        connexion.query(
          "INSERT INTO categories SET ?",
          newCategory,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "category created successfully" });
          }
        );
      }
    );
  }
);

//delete category
router.delete(
  "/:categoryId",
   [auth, authoriz],
  (req, res, next) => {
    connexion.query(
      "SELECT * FROM categories WHERE id=?",
      req.params.categoryId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "category not found" });
        connexion.query(
          "DELETE FROM categories WHERE id=?",
          req.params.categoryId,
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "category deleted successfully" });
          }
        );
      }
    );
  }
);

//update category
router.put(
  "/:categoryId",
  [auth, authoriz],
  (req, res, next) => {
    if (
      (!req.body.Engname || req.body.Engname.length == 0) &&
      (!req.body.Arabname || req.body.Arabname.length == 0)(
        !req.body.color || req.body.color.length == 0
      )(!req.body.delay || req.body.delay.length == 0)
    )
      return res
        .status(400)
        .json({ message: "Engname Or Arabname is required" });

    connexion.query(
      "SELECT * FROM categories WHERE id=?",
      req.params.categoryId,
      (error, result) => {
        if (error) return next(error);
        if (!result[0])
          return res.status(400).json({ message: "category not found" });
        let engname = req.body.Engname || result[0].Engname;
        let arabname = req.body.Arabname || result[0].Arabname;
        let color = req.body.color || result[0].color;
        let delay = req.body.delay || result[0].delay;
        connexion.query(
          "UPDATE categories SET Engname=?,Arabname=?,color=?,delay=? WHERE id=?",
          [engname, arabname, color, delay, req.params.categoryId],
          (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "category updated successfully" });
          }
        );
      }
    );
  }
);

module.exports = router;
