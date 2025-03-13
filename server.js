const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const workersRoute = require("./routes/worker.routes");
const holidaysRoute = require("./routes/holiday.routes");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/workers", workersRoute);
app.use("/api/holidays", holidaysRoute);

mongoose.connect("mongodb://127.0.0.1:27017").then(() => {
  console.log("✅ MongoDB connected successfully");
});

app.listen(5000, () =>
  console.log("🚀 Server is running on http://localhost:5000")
);
