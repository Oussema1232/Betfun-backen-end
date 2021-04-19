const express = require("express");

const app = express();

require("./startup/logging");
require("./startup/database");
require("./startup/routes")(app);
require("./startup/config")();
require("./startup/prod")(app);

const port = process.env.PORT || 3001;
const server = app.listen(port, console.log(`connecting on PORT ${port}`));

module.exports = server;
