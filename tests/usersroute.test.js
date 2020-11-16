const request = require("supertest");
const connexion = require("../startup/database");
const createtoken = require("../token/createtoken");

let server;
let token;
const user = {
  id: 1,
  username: "Soltaninou",
  userpassword: "oussema1.",
  countryId: 1,
  email: "oussematou@gmail.com",
};

describe("/api/users", () => {
  beforeEach(() => {
    server = require("../app");
    token = createtoken(user);
  });
  afterEach(() => {
    connexion.query(`DELETE FROM users`, function (error, results) {});
    server.close();
  });

  describe("GET /:id", () => {
    it("should return a user if valid id is passed", (done) => {
      const user2 = {
        username: "Soltaninou",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematou@gmail.com",
      };
      connexion.query(`INSERT INTO users SET?`, user2, async function (
        error,
        results
      ) {
        if (!error) {
          try {
            const res = await request(server)
              .get("/api/users/" + results.insertId)
              .set("x-auth-token", token)
              .expect(200);

            expect(res.body).toHaveProperty("username", user.username);
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it("should return a 400 if invalid id is passed", async (done) => {
      try {
        const res = await request(server)
          .get("/api/users/" + 102365478963652)
          .set("x-auth-token", token);

        expect(res.status).toBe(400);
      } catch (err) {
        done(err);
      }
    });
  });

  describe("Post/", () => {
    it("Should return 400 if username already exists", (done) => {
      const user1 = {
        username: "Soltaninou",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematou@gmail.com",
      };

      const user3 = {
        username: "Soltaninou",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematouton@gmail.com",
      };
      connexion.query(`INSERT INTO users SET?`, user1, async function (
        error,
        results
      ) {
        if (!error) {
          try {
            const res = await request(server).post("/api/users/").send(user3);

            expect(res.status).toBe(400);
          } catch (err) {
            done(err);
          }
        }
      });
    });
    it("Should return 400 if email already exists", (done) => {
      const user5 = {
        username: "Soltaninou",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematou@gmail.com",
      };

      const user6 = {
        username: "Soltaninou123",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematou@gmail.com",
      };
      connexion.query(`INSERT INTO users SET?`, user5, async function (
        error,
        results
      ) {
        if (!error) {
          try {
            const res = await request(server).post("/api/users/").send(user6);

            expect(res.status).toBe(400);
          } catch (err) {
            done(err);
          }
        }
      });
    });
    it("Should return 400 if countryId is not valid", async (done) => {
      const user7 = {
        username: "Soltaninou123",
        userpassword: "oussema1.",
        countryId: 50,
        email: "oussematou123@gmail.com",
      };
      try {
        const res = await request(server).post("/api/users/").send(user7);
        expect(res.status).toBe(400);
      } catch (err) {}
    });
    it("Should return 200 if body valid", async () => {
      const user8 = {
        username: "Soltaninou123",
        userpassword: "oussema1.",
        countryId: 1,
        email: "oussematou@gmail.com",
      };
      try {
        const res = await request(server).post("/api/users/").send(user8);

        expect(res.status).toBe(200);
      } catch (err) {
        done(err);
      }
    });
  });

  describe("Delete/:id", () => {
    it("Should return 403 if token id is different than user id", async (done) => {
      try {
        const res = await request(server)
          .delete("/api/users/" + 2)
          .set("x-auth-token", token);

        expect(res.status).toBe(403);
      } catch (err) {
        done(err);
      }
    });
    it("Should return 400 if there is no user under this id", async (done) => {
      try {
        const res = await request(server)
          .delete("/api/users/" + 1)
          .set("x-auth-token", token);

        expect(res.status).toBe(400);
      } catch (err) {
        done(err);
      }
    });
    it("Should return 200 if the user is deleting himself (token id==user id)", (done) => {
      connexion.query(`INSERT INTO users SET?`, user, async function (
        error,
        results
      ) {
        if (!error) {
          try {
            const res = await request(server)
              .delete("/api/users/" + 1)
              .set("x-auth-token", token);

            expect(res.status).toBe(200);
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });
});
