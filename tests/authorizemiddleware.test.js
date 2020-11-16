const request = require("supertest");
const connexion = require("../startup/database");
const createtoken = require("../token/createtoken");

let server;
let token;

let idtodelete;
let user = {
  username: "Soltaninou",
  userpassword: "oussema1.",
  isAdmin: true,
  countryId: 1,
  email: "oussematou@gmail.com",
};

let user2 = {
  username: "fasou5",
  userpassword: "oussema1.",
  countryId: 2,
  email: "souzouki@gmail.com",
};

describe("/api/users", () => {
  beforeEach(() => {
    server = require("../app");
  });

  beforeEach(() => {
    connexion.query(`INSERT INTO users SET?`, user2, function (err, results) {
      if (!err) {
        idtodelete = results.insertId;
      }
    });
  });

  afterEach(() => {
    connexion.query(`DELETE FROM users`, function (error, results) {});
    server.close();
  });

  describe("Delete/:id", () => {
    it("Should return 403 if user is not admin", async (done) => {
      try {
        user.isAdmin = false;
        console.log("user", user);
        token = createtoken(user);
        const res = await request(server)
          .delete("/api/users/adminuser/" + idtodelete)
          .set("x-auth-token", token);

        expect(res.status).toBe(403);
      } catch (err) {
        done(err);
      }
    });

    it("Should return 200 if user is admin", async (done) => {
      try {
        user.isAdmin = true;
        token = createtoken(user);
        const res = await request(server)
          .delete("/api/users/adminuser/" + idtodelete)
          .set("x-auth-token", token);

        expect(res.status).toBe(200);
      } catch (err) {
        done(err);
      }
    });
  });
});
