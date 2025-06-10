// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const UserSchema = new Schema({
//   name: String,
//   username: { type: String, unique: true },
//   password: String,
// });

// const UserModel = mongoose.model("User", UserSchema);

const { Sequelize } = require("sequelize");
// import db from "../config/database.js";
const db = require("../config/database.js");

const UserModel = db.define("user", {
  name: {
    type: Sequelize.STRING,
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
  },
});

db.sync().then(() => console.log("user synced"));

module.exports = UserModel;
