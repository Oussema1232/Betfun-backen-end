module.exports = {
  apps: [
    {
      script: "./app.js",
      watch: ".",
    },
    {
      script: "./service-worker/",
      watch: ["./service-worker"],
    },
  ],

  deploy: {
    production: {
      user: "node",
      host: "https://betfunbackend1.herokuapp.com",
      ref: "origin/master",
      repo: "https://git.heroku.com/betfunbackend1.git",
      path: "https://betfunbackend1.herokuapp.com",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
