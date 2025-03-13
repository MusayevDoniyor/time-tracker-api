const { default: mongoose } = require("mongoose");

const connectDB = () => {
  const MONGO_URL = process.env.MONGO_URL.replace(
    "<db_password>",
    process.env.MONGO_PASSWORD
  );

  mongoose
    .connect(MONGO_URL)
    .then(() => {
      console.log("✅ MongoDB connected successfully");
    })
    .catch((err) => {
      console.log("❌ MongoDB connection failed", err.message);
    });
};

module.exports = connectDB;
