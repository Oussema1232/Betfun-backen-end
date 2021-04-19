const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");

const router = express.Router();

//get informations
router.get("/:categoryId", auth, (req, res, next) => {
  let q = "SELECT * FROM categories ";
  if (req.params.categoryId != "All") q += `WHERE id=${req.params.categoryId}`;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({ message: "category not found" });
    let q = "SELECT * FROM informations ";
    if (req.params.categoryId != "All")
      q += `WHERE categoryId=${req.params.categoryId}`;
    connexion.query(q, (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "there are no informations available" });
      return res.status(200).json({
        data: result,
        message: "information loaded successfully",
      });
    });
  });
});

router.get("/one/:categoryId/:language", auth, (req, res, next) => {
  let q = "SELECT * FROM categories ";
  if (req.params.categoryId != "All") q += `WHERE id=${req.params.categoryId}`;
  connexion.query(q, (error, result) => {
    if (error) return next(error);
    if (!result[0])
      return res.status(400).json({
        message:
          req.params.language == "Arab"
            ? "الفئة غير موجودة"
            : "Category not found",
      });
    let q = "SELECT * FROM informations ";
    if (req.params.categoryId != "All")
      q += `WHERE categoryId=${req.params.categoryId}`;
    connexion.query(q, (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({
          message:
            req.params.language == "Arab"
              ? "لا توجد معلومات لهذا اليوم"
              : "No informations for today",
        });
      let informations = result;

      connexion.query(
        "SELECT * ,CURDATE() as new_date FROM get_informations WHERE categoryId=?",
        req.params.categoryId,
        (error, result) => {
          if (error) return next(error);
          let q = "";
          let information;
          if (!result[0]) {
            q = `INSERT INTO get_informations(categoryId,informationId,update_date) 
                  VALUES("${req.params.categoryId}",${informations[0].id},CURDATE())`;
            information = informations[0];
            connexion.query(q, (error, result) => {
              if (error) return next(error);
              return res.status(200).json({
                data: information,
                message:
                  req.params.language == "Arab"
                    ? "تم تحميل المعلومات بنجاح"
                    : "Information loaded successfully",
              });
            });
          } else {
            dateDiff =
              (result[0].new_date - result[0].update_date) / (1000 * 3600 * 24);
            let index = informations.findIndex(
              (el) => el.id == result[0].informationId
            );
            if (index == -1) {
              q = `
                      UPDATE get_informations 
                      SET informationId=${informations[0].id} ,
                         update_date=CURDATE()
                      WHERE categoryId="${req.params.categoryId}"
                      `;
              connexion.query(q, (error, result) => {
                if (error) return next(error);
                return res.status(200).json({
                  data: informations[0],
                  message:
                    req.params.language == "Arab"
                      ? "تم تحميل المعلومات بنجاح"
                      : "Information loaded successfully",
                });
              });
            }
            if (dateDiff < 3)
              return res.status(200).json({
                data: informations[index],
                message: "information loaded successfully",
              });
            console.log(index);
            informations.length == index + 1
              ? (index = 0)
              : (index = index + 1);
            console.log(index);
            q = `
                  UPDATE get_informations 
                  SET informationId=${informations[index].id} ,
                     update_date=CURDATE()
                  WHERE categoryId="${req.params.categoryId}"
                  `;
            connexion.query(q, (error, result) => {
              if (error) return next(error);
              return res.status(200).json({
                data: informations[index],
                message:
                  req.params.language == "Arab"
                    ? "تم تحميل المعلومات بنجاح"
                    : "Information loaded successfully",
              });
            });
          }
        }
      );
    });
  });
});

//create new information
router.post("/", [auth, authoriz], (req, res, next) => {
  if (!req.body.Engdescription)
    return res.status(400).json({ message: "Engdescription is required" });
  if (!req.body.Arabdescription)
    return res.status(400).json({ message: "Arabdescription is required" });
  if (!req.body.categoryId)
    return res.status(400).json({ message: "categoryId is required" });
  connexion.query(
    "SELECT * FROM categories WHERE id=?",
    req.body.categoryId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "category not found" });
      const newInformation = {
        Engdescription: req.body.Engdescription,
        Arabdescription: req.body.Arabdescription,
        categoryId: req.body.categoryId,
      };
      connexion.query(
        "INSERT INTO informations SET ?",
        newInformation,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "information created successfully" });
        }
      );
    }
  );
});

//update information
router.put("/:informationId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * From informations WHERE id=?",
    req.params.informationId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "information not found" });
      let information = result[0];
      let categoryId = req.body.categoryId || information.categoryId;
      connexion.query(
        "SELECT * FROM categories WHERE id=?",
        categoryId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "invalid categoryId" });
          let q = `
            UPDATE informations SET
                Engdescription="${
                  req.body.Engdescription || information.Engdescription
                }",
                Arabdescription="${
                  req.body.Arabdescription || information.Arabdescription
                }",
                categoryId=${categoryId}
            WHERE id=${req.params.informationId};
            `;
          connexion.query(q, (error, result) => {
            if (error) return next(error);
            return res
              .status(200)
              .json({ message: "information updated successfully" });
          });
        }
      );
    }
  );
});

//delete information
router.delete("/:informationId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * From informations WHERE id=?",
    req.params.informationId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "information not found" });
      connexion.query(
        "DELETE FROM informations WHERE id=?",
        req.params.informationId,
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "information deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
