const express = require("express");
const auth = require("../middleware/auth");
const authoriz = require("../middleware/authoriz");
const connexion = require("../startup/database");
const router = express.Router();

router.get("/", auth, (req, res, next) => {
  connexion.query(`SELECT * FROM seasons`, function (err, results) {
    if (err) return next(err);

    if (!results[0])
      return res.status(400).send("There are no seasons available");
    res
      .status(200)
      .json({ data: results, message: "Seasons loaded successfully" });
  });
});

//get seasons of specific domain
router.get("/:domainId", auth, (req, res, next) => {
  const q = `
  SELECT seasons.id AS id , seasons.name AS name,isFinished FROM seasons
  JOIN gameweeks 
  ON seasons.id=gameweeks.seasonId
  JOIN domain_seasonstatus 
  ON seasons.id=domain_seasonstatus.seasonId AND domain_seasonstatus.domainId=${req.params.domainId}
  WHERE gameweeks.domainId=?
  GROUP BY gameweeks.seasonId;
  `;
  connexion.query(
    "SELECT * FROM betfun_domains WHERE id=?",
    req.params.domainId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "Domain not found" });
      connexion.query(q, req.params.domainId, (error, result) => {
        if (error) return next(error);
        return res
          .status(200)
          .json({ message: "Seasons of domains", data: result });
      });
    }
  );
});

//Admin

// add new season
router.post("/", [auth, authoriz], (req, res, next) => {
  if (!req.body.name)
    return res.status(400).json({ message: "name is required" });
  if (!req.body.domainId)
    return res.status(400).json({ message: "domainId is required" });

  connexion.query(
    "SELECT * FROM seasons WHERE name=?",
    req.body.name,
    (error, result) => {
      if (error) return next(error);
      let q = "SELECT 1;";
      let seasonId = "";
      if (result[0]) seasonId = result[0].id;
      if (!result[0]) {
        q = `
          INSERT INTO seasons
          SET ?;
          `;
      }
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(q, { name: req.body.name }, (error, result) => {
          if (error) {
            return connexion.rollback(function () {
              return next(error);
            });
          }
          if (result.insertId) seasonId = result.insertId;
          const newseasonDomain = {
            seasonId,
            domainId: req.body.domainId,
          };
          connexion.query(
            "SELECT * FROM domain_seasonstatus WHERE seasonId=? AND domainId=?",
            [seasonId, req.body.domainId],
            (error, result) => {
              if (error) {
                return connexion.rollback(function () {
                  return next(error);
                });
              }
              if (result[0])
                return res
                  .status(400)
                  .json({ message: "season already exist for this domain" });
              connexion.query(
                "INSERT INTO domain_seasonstatus SET ?",
                newseasonDomain,
                (error, result) => {
                  if (error) {
                    return connexion.rollback(function () {
                      return next(error);
                    });
                  }
                  let q = `
                          UPDATE domain_seasonstatus 
                          SET isfinished=true
                          WHERE domainId=${req.body.domainId} AND seasonId<>${seasonId};
                          UPDATE leagues 
                          SET seasonId=${seasonId}
                          WHERE domainId=${req.body.domainId} AND countryId IS NOT NULL;
                          `;
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
                        .json({ message: "season created successfully" });
                    });
                  });
                }
              );
            }
          );
        });
      });
    }
  );
});

//update season
router.put("/:seasonId", [auth, authoriz], (req, res, next) => {
  if (!req.body.name)
    return res.status(400).json({ message: "name of season is required" });
  connexion.query(
    "SELECT * FROM seasons WHERE id=?",
    req.params.seasonId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "season not found" });
      let q = `
      UPDATE seasons 
      SET name=?
      WHERE id=?
      `;
      connexion.query(
        q,
        [req.body.name, req.params.seasonId],
        (error, result) => {
          if (error) return next(error);
          return res
            .status(200)
            .json({ message: "season update successfully" });
        }
      );
    }
  );
});

//update season status(isfinished)
router.put("/:seasonId/:domainId", [auth, authoriz], (req, res, next) => {
  if (req.body.isfinished == undefined)
    return res.status(400).json({ message: "isfinished is required" });
  connexion.query(
    "SELECT * FROM domain_seasonstatus WHERE seasonId=? AND domainId=?",
    [req.params.seasonId, req.params.domainId],
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res
          .status(400)
          .json({ message: "domain_seasonstatus not found" });
      if (req.body.isfinished == true && result[0].isFinished == 1)
        return res
          .status(400)
          .json({ message: "domain_seasonstatus alrady finished" });
      if (req.body.isfinished == false && result[0].isFinished == 0)
        return res
          .status(400)
          .json({ message: "domain_seasonstatus alrady not finished" });
      connexion.query(
        "SELECT * FROM domain_seasonstatus WHERE domainId=? AND isFinished=false",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (result[0] && req.body.isfinished == false) {
            return res
              .status(400)
              .json({ message: "you have an other season not finished " });
          }
          connexion.beginTransaction((err) => {
            if (err) {
              return next(err);
            }
            connexion.query(
              "UPDATE domain_seasonstatus SET isfinished=? WHERE domainId=? AND seasonId=?",
              [req.body.isfinished, req.params.domainId, req.params.seasonId],
              (error, result) => {
                if (error) {
                  return connexion.rollback(function () {
                    return next(error);
                  });
                }
                let q = "SELECT 1;";
                if (req.body.isfinished == false) {
                  q = `
                                  UPDATE leagues 
                                  SET seasonId=${req.params.seasonId}
                                  WHERE domainId=${req.params.domainId} 
                                  AND countryId IS NOT NULL;
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
                      .json({ message: "season status update successfully" });
                  });
                });
              }
            );
          });
        }
      );
    }
  );
});

//delete season status
router.delete("/:seasonId/:domainId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * FROM seasons WHERE id=?",
    req.params.seasonId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "season not found" });
      connexion.query(
        "SELECT * FROM betfun_domains WHERE id=?",
        req.params.domainId,
        (error, result) => {
          if (error) return next(error);
          if (!result[0])
            return res.status(400).json({ message: "domain not found" });
          connexion.query(
            "SELECT * FROM domain_seasonstatus WHERE seasonId=? AND domainId=?",
            [req.params.seasonId, req.params.domainId],
            (error, result) => {
              if (error) return next(error);
              if (!result[0])
                return res
                  .status(400)
                  .json({ message: "domain_seasonstatus not found" });
              connexion.beginTransaction((err) => {
                if (err) {
                  return next(err);
                }
                connexion.query(
                  "UPDATE leagues SET seasonId=null WHERE seasonId=? AND domainId=? AND countryId IS NOT NULL",
                  [req.params.seasonId, req.params.domainId],
                  (error, result) => {
                    if (error) {
                      return connexion.rollback(function () {
                        return next(error);
                      });
                    }
                    connexion.query(
                      "SELECT * FROM domain_seasonstatus WHERE seasonId=?",
                      req.params.seasonId,
                      (error, result) => {
                        if (error) {
                          return connexion.rollback(function () {
                            return next(error);
                          });
                        }
                        let q = "";
                        if (result.length == 1)
                          q = `DELETE FROM seasons WHERE id=${req.params.seasonId}`;
                        else {
                          q = `
                                      DELETE FROM domain_seasonstatus 
                                      WHERE seasonId=${req.params.seasonId} 
                                      AND domainId=${req.params.domainId};
                                      `;
                        }
                        connexion.query(q, (error, result) => {
                          if (error) {
                            return connexion.rollback(function () {
                              return next(error);
                            });
                          }
                          let q = `
                                          DELETE FROM leagues 
                                          WHERE seasonId=${req.params.seasonId} 
                                          AND domainId=${req.params.domainId};
                                          `;
                          connexion.query(q, (error, result) => {
                            if (error) {
                              return connexion.rollback(function () {
                                return next(error);
                              });
                            }
                            connexion.query(
                              "DELETE FROM gameweeks WHERE seasonId=? AND domainId=?;",
                              [req.params.seasonId, req.params.domainId],
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
                                  return res.status(200).json({
                                    message:
                                      "domain_seasonstatus deleted successfully",
                                  });
                                });
                              }
                            );
                          });
                        });
                      }
                    );
                  }
                );
              });
            }
          );
        }
      );
    }
  );
});

//delete season
router.delete("/:seasonId", [auth, authoriz], (req, res, next) => {
  connexion.query(
    "SELECT * FROM seasons WHERE id=?",
    req.params.seasonId,
    (error, result) => {
      if (error) return next(error);
      if (!result[0])
        return res.status(400).json({ message: "season not found" });
      connexion.beginTransaction((err) => {
        if (err) {
          return next(err);
        }
        connexion.query(
          "DELETE FROM seasons WHERE id=?",
          req.params.seasonId,
          (error, result) => {
            if (error) {
              return connexion.rollback(function () {
                return next(error);
              });
            }
            let q = `UPDATE leagues SET seasonId=null WHERE seasonId=? AND countryId IS NOT NULL `;
            connexion.query(q, req.params.seasonId, (error, result) => {
              if (error) {
                return connexion.rollback(function () {
                  return next(error);
                });
              }
              connexion.query(
                "DELETE FROM leagues WHERE seasonId=?",
                req.params.seasonId,
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
                      .json({ message: "season deleted successfully" });
                  });
                }
              );
            });
          }
        );
      });
    }
  );
});

module.exports = router;
