const cron = require("node-cron");
const {
  resetDailyWorkerStatus,
  resetMonthlyWorkerStatus,
} = require("../utils/workerStatus");

// Schedule daily reset at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily worker status reset...");
  await resetDailyWorkerStatus();
});

// Schedule monthly reset on the 1st day of each month at 00:01
cron.schedule("1 0 1 * *", async () => {
  console.log("Running monthly worker status reset...");
  await resetMonthlyWorkerStatus();
});

module.exports = {
  initCronJobs: () => {
    console.log("Worker status cron jobs initialized");
  },
};
