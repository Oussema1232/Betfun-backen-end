const cloudinary = require("cloudinary").v2;
const config = require("config");

cloudinary.config(config.get("cloudinaryconfig"));

module.exports = cloudinary;
