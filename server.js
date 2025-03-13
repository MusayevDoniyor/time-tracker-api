require("dotenv").config();
const express = require("express");
const cors = require("cors");

const workersRoute = require("./routes/worker.routes");
const holidaysRoute = require("./routes/holiday.routes");

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/workers", workersRoute);
app.use("/api/holidays", holidaysRoute);

const PORT = process.env.PORT;

connectDB();

app.listen(PORT, () =>
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
);
