const cron = require("node-cron");
const {
  resetDailyWorkerStatus,
  resetMonthlyWorkerStatus,
} = require("../utils/workerStatus");

cron.schedule("0 0 * * *", async () => {
  console.log("Running daily worker status reset...");
  await resetDailyWorkerStatus();
});

cron.schedule("1 0 1 * *", async () => {
  console.log("Running monthly worker status reset...");
  await resetMonthlyWorkerStatus();
});

module.exports = {
  initCronJobs: () => {
    console.log("Worker status cron jobs initialized");
  },
};
