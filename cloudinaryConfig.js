const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dod0twmjb",
  api_key: "582242889634526",
  api_secret: "sVc7O-JJGUeqP-GDaLVOi6ThvVg",
  secure: true,
});

module.exports = cloudinary;
