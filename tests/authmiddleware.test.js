const request = require("supertest");
const connexion = require("../startup/database");
const createtoken = require("../token/createtoken");

describe("auth middleware", function () {
  beforeAll(function () {
    jest.setTimeout(10000);
  });
  beforeEach(function () {
    server = require("../app");
  });

  afterEach(function () {
    connexion.query(`DELETE FROM users`, function (error, results) {});
    server.close();
  });

  let token;
  let userId;
  let user = {
    username: "Soltaninou",
    userpassword: "oussema1.",
    countryId: 1,
    email: "oussematou@gmail.com",
  };

  function exec() {
    return request(server)
      .get("/api/users/" + userId)
      .set("x-auth-token", token);
  }

  beforeEach(function () {
    connexion.query(`INSERT INTO users SET?`, user, function (error, results) {
      if (!error) {
        user.id = results.insertId;
        userId = results.insertId;

        token = createtoken(user);
      }
    });
  });

  it("should return 401 if no token is provided", async function (done) {
    token = "";

    try {
      const res = await exec();

      expect(res.status).toBe(401);
    } catch (err) {
      done(err);
    }
  });

  it("should return 400 if token is invalid", async function (done) {
    token = "a";

    try {
      const res = await exec();

      expect(res.status).toBe(400);
    } catch (err) {
      done(err);
    }
  });

  it("should return 200 if token is valid", async function (done) {
    try {
      const res = await exec();

      expect(res.status).toBe(200);
    } catch (err) {
      done(err);
    }
  });
});
