const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const SheepModel = db.define("sheep", {
  name: {
    type: Sequelize.STRING,
  },
  price: {
    type: Sequelize.INTEGER,
  },
  type: {
    type: Sequelize.STRING,
  },
  age: {
    type: Sequelize.INTEGER,
  },
  height: {
    type: Sequelize.INTEGER,
  },
  weight: {
    type: Sequelize.INTEGER,
  },
  color: {
    type: Sequelize.STRING,
  },
  desc: {
    type: Sequelize.TEXT,
  },
  category: {
    type: Sequelize.STRING,
  },
  status: {
    type: Sequelize.STRING,
  },
  photos: {
    type: Sequelize.TEXT,
    get() {
      const rawValue = this.getDataValue("photos");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("photos", JSON.stringify(value));
    },
  },
});

db.sync().then(() => console.log("sheep synced"));

module.exports = SheepModel;
