const express = require("express");

const {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  addWorkDay,
  addLeave,
  addFine,
  calculateSalary,
  checkIn,
  checkOut,
  outside,
  resetDailyStatus,
  resetMonthlyStatus,
} = require("../controllers/worker.controller");

const router = express.Router();

// * WORKER CRUD
// 📌 Ishchi qo'shish
router.post("/", createWorker);

// 📌 Barcha ishchilarni olish
router.get("/", getWorkers);

// 📌 ID bo‘yicha ishchini olish
router.get("/:id", getWorkerById);

// 📌 Ishchini yangilash
router.put("/:id", updateWorker);

// 📌 Ishchini o'chirish
router.delete("/:id", deleteWorker);

// * WORKER ACTIONS
// 📌 Ish kunini qo‘shish
router.post("/:id/workday", addWorkDay);

// 📌 Ruxsat (ta'til) qo‘shish
router.post("/:id/leave", addLeave);

// 📌 Jarima qo‘shish
router.post("/:id/fine", addFine);

// 📌 Ishchi oyligini hisoblash
router.get("/:id/salary", calculateSalary);

// 📌 Ishchi keldi
router.post("/:id/check-in", checkIn);

// 📌 Ishchi ketdi
router.post("/:id/check-out", checkOut);

// 📌 Ishchi tashqarida
router.post("/:id/outside", outside);

// * WORKER STATUS RESETS
// 📌 Kunlik statuslarni yangilash
router.post("/reset-daily", resetDailyStatus);

// 📌 Oylik statuslarni yangilash
router.post("/reset-monthly", resetMonthlyStatus);

module.exports = router;
