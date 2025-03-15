require("dotenv").config();
const express = require("express");
const cors = require("cors");

const workersRoute = require("./routes/worker.routes");
const holidaysRoute = require("./routes/holiday.routes");
const branchesRoute = require("./routes/branches.routes");
const renderMainPageRoutes = require("./routes/main.route");

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/", renderMainPageRoutes);

// API routes
app.use("/api/workers", workersRoute);
app.use("/api/holidays", holidaysRoute);
app.use("/api/branches", branchesRoute);

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () =>
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
);
