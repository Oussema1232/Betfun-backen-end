module.exports = function (req, res, next) {
  if (req.user.isAdmin != 1)
    return res
      .status(403)
      .json({ message: "Access forbidden, you are not an admin user" });
  next();
};
