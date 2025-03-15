const express = require("express");
const Worker = require("../models/worker.model");
const Holiday = require("../models/holiday.model");
const Branch = require("../models/branch.model");

const router = express.Router();

function calculateMinutes(fixedTime, actualTime) {
  const [fixedHour, fixedMin] = fixedTime.split(":").map(Number);
  const [actualHour, actualMin] = actualTime.split(":").map(Number);
  const fixedMinutes = fixedHour * 60 + fixedMin;
  const actualMinutes = actualHour * 60 + actualMin;

  return Math.max(fixedMinutes - actualMinutes, 0);
}

function getDistance(loc1, loc2) {
  const R = 6371; // Yer radiusi (km)
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Masofa (km)
}

// 📌 Ishchi qo'shish
router.post("/", async (req, res) => {
  try {
    const { name, phone, position, branch, salary, finePerMinute } = req.body;

    const existingWorker = await Worker.findOne({ phone });
    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan!" });
    }

    const newWorker = new Worker({
      name,
      phone,
      position,
      branch,
      salary: salary || 0,
      finePerMinute: finePerMinute || 0,
    });

    await newWorker.save();
    res
      .status(201)
      .json({ message: "Ishchi muvaffaqiyatli qo'shildi!", worker: newWorker });
  } catch (error) {
    res.status(500).json({ error: error.message });
    31;
  }
});

// 📌 Barcha ishchilarni olish
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.status(200).json({ count: workers.length, workers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ID bo‘yicha ishchini olish
router.get("/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ishchini yangilash
router.put("/:id", async (req, res) => {
  try {
    if (!Object.keys(req.body).length)
      return res
        .status(400)
        .json({ error: "Yangilash uchun ishchi ma'lumotlari berilmadi!" });

    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedWorker)
      return res.status(404).json({ error: "Ishchi topilmadi" });

    res.status(200).json({
      message: "Ishchi ma'lumoti muvaffaqiyatli yangilandi!",
      worker: updatedWorker,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ishchini o'chirish
router.delete("/:id", async (req, res) => {
  try {
    const deletedWorker = await Worker.findByIdAndDelete(req.params.id);
    if (!deletedWorker)
      return res.status(404).json({ error: "Ishchi topilmadi" });

    res.json({ message: "Ishchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ish kunini qo‘shish
router.post("/:id/workday", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { $push: { workDays: req.body } },
      { new: true }
    );

    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ruxsat (ta'til) qo‘shish
router.post("/:id/leave", async (req, res) => {
  try {
    if (!Object.keys(req.body).length)
      return res.status(400).json({
        error: "Ta'til berish uchun barcha ma'lumotlarni kiriting!",
      });

    const { start, end, reason, type } = req.body;

    if (!start || !end || !type)
      return res
        .status(400)
        .json({ message: "Ta'til berish uchun barcha ma'lumotlarni kiriting" });

    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    //* 📌 Agar bu kunga ta'til belgilangan bo'lsa, xatolik qaytarish
    const existingLeave = worker.leaves.find((leave) => {
      return (
        new Date(leave.start).toISOString().split("T")[0] ===
          startDate.toISOString().split("T")[0] ||
        new Date(leave.end).toISOString().split("T")[0] ===
          endDate.toISOString().split("T")[0]
      );
    });

    if (existingLeave)
      return res
        .status(400)
        .json({ error: "Ushbu sanaga allaqachon ta'til belgilangan!" });

    //* 📌 Agar bu sana dam olish kuni bo'lsa, ta'til berilmasin
    const isHoliday = await Holiday.findOne({
      date: { $gte: startDate, $lte: endDate },
    });

    if (isHoliday)
      return res.status(400).json({
        error: "Ushbu sana dam olish kuni sifatida belgilangan!",
      });

    //* 📌 Eski ta'tillarni avtomatik tozalash
    worker.leaves = worker.leaves.filter(
      (leave) => new Date(leave.end) >= today
    );

    //* 📌 Yangi ta'til qo'shish
    worker.leaves.push({
      start,
      end,
      reason,
      type,
    });

    await worker.save();

    res.status(201).json({
      message: "Ishchi uchun ta'til muvaffaqiyatli qo'shildi!",
      worker,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Jarima qo‘shish
router.post("/:id/fine", async (req, res) => {
  try {
    const { amount, reason, date } = req.body;

    if (!amount || !reason || !date) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const fineDate = new Date(date);
    if (isNaN(fineDate.getTime())) {
      return res.status(400).json({ error: "Noto'g'ri sana formati!" });
    }

    worker.fines.push({ amount, reason, date: fineDate });

    worker.penalty += amount;
    await worker.save();

    res.status(201).json({
      message: "Jarima muvaffaqiyatli qo'shildi!",
      worker,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ishchi oyligini hisoblash
router.get("/:id/salary", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const totalFines = worker.fines.reduce((sum, fine) => sum + fine.amount, 0);
    const finalSalary = worker.salary - totalFines;

    res
      .status(200)
      .json({ salary: worker.salary, fines: totalFines, finalSalary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ishchi keldi
router.post("/:id/check-in", async (req, res) => {
  try {
    const { checkInTime } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let workDay = worker.workDays.find(
      (day) => day.date.toISOString().split("T")[0] === today
    );

    if (!workDay) {
      workDay = {
        date: new Date(),
        checkIn: checkInTime,
        checkOut: null,
      };
      worker.workDays.push(workDay);
    } else {
      workDay.checkIn = checkInTime;
    }

    worker.checkInTime = checkInTime;
    worker.isPresent = true;

    const lateMinutes = calculateMinutes(worker.checkInTime, checkInTime);

    if (lateMinutes > 0) {
      const hasLeave = worker.leaves.some((leave) => {
        const leaveStart = leave.start.toISOString().split("T")[0];
        const leaveEnd = leave.start.toISOString().split("T")[0];
        return today >= leaveStart && today <= leaveEnd;
      });

      if (!hasLeave) {
        worker.isLate = true;
        workDay.lateMinutes = lateMinutes;

        if (worker.autoFine) {
          const fineAmount = lateMinutes * worker.finePerMinute;
          worker.fines.push({ amount: fineAmount, date: new Date() });
          worker.penalty += fineAmount;
        }
      }
    }
    await worker.save();

    res.status(200).json({ message: "Ishchi kelgai qayd etildi", worker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/check-out", async (req, res) => {
  try {
    const { checkOutTime } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const today = new Date().toISOString().split("T")[0];

    let workDay = worker.workDays.find(
      (day) => day.date.toISOString().split("T")[0] === today
    );

    if (!workDay) {
      return res.status(400).json({
        error:
          "Ishchi kelmagan, shuning uchun ketish vaqtini belgilash mumkin emas!",
      });
    }

    workDay.checkOut = checkOutTime;
    worker.checkOutTime = checkOutTime;
    worker.isPresent = false;

    // Ishchining belgilangan chiqish vaqti
    const fixedCheckOut = "18:00"; // Masalan, 18:00 chiqish vaqti

    const earlyMinutes = calculateMinutes(fixedCheckOut, checkOutTime);

    if (earlyMinutes > 0) {
      const hasLeave = worker.leaves.some((leave) => {
        const leaveStart = leave.start.toISOString().split("T")[0];
        const leaveEnd = leave.end.toISOString().split("T")[0];
        return today >= leaveStart && today <= leaveEnd;
      });

      if (!hasLeave) {
        worker.leftEarly = true;
        workDay.leftEarlyMinutes = earlyMinutes;

        if (worker.autoFine) {
          const fineAmount = earlyMinutes * worker.finePerMinute;
          worker.fines.push({
            amount: fineAmount,
            date: new Date(),
            reason: "Vaqtli ketish",
          });
          worker.penalty += fineAmount;
        }
      }
    }

    await worker.save();

    res.status(200).json({ message: "Ishchi ketgani qayd etildi", worker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/outside", async (req, res) => {
  try {
    const { location } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) return res.status(404).json({ error: "Ishchi topilmadi" });

    const branch = await Branch.findById(worker.branch);
    if (!branch) return res.status(404).json({ error: "Filial topilmadi" });

    const distance = getDistance(location, branch.location);
    const isOutside = distance > branch.radius;

    if (isOutside) {
      worker.isOutside = true;
      worker.penalty += worker.finePerMinute;
      await worker.save();
    } else {
      worker.isOutside = false;
    }

    res
      .status(200)
      .json({ message: "Ishchi joylashuvi tekshirildi", isOutside });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
