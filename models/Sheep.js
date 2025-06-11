const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Sheep = db.define("sheep", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  price: {
    type: Sequelize.INTEGER,
    allowNull: false,
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
      const raw = this.getDataValue("photos");
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue("photos", JSON.stringify(value));
    },
  },
}, {
  timestamps: true,
});

module.exports = Sheep;
