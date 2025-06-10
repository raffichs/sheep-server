const { Sequelize } = require("sequelize");

const db = new Sequelize("sheep_db", "admin", "nofangagah", {
  host: "34.46.59.140",
  dialect: "mysql",
});

db.authenticate()
  .then(() => console.log("✅ Connected to DB!"))
  .catch((err) => console.error("❌ DB connection failed:", err));

module.exports = db;
