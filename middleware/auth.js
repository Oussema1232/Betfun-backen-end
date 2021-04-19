const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, config.get("secretkey")); //decode the token to a payload {_id:...} in this exemple we set _id
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "You are not signed in" });
    
  }
};
