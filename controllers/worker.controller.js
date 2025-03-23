const Worker = require("../models/worker.model");
const Holiday = require("../models/holiday.model");
const Branch = require("../models/branch.model");
const { calculateMinutes, getDistance } = require("../utils/helper");
const findDocumentById = require("../utils/findDocument");
const response = require("../utils/response");

//* 1️⃣ WORKER CRUD
// 📌 Ishchi qo'shish
const createWorker = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "position",
      "branch",
      "salary",
      "penalty",
      "finePerMinute",
      "autoFine",
      "fixedHours",
      "checkInTime",
      "checkOutTime",
    ];

    const workerData = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        workerData[key] = req.body[key];
      }
    });

    const { name, phone, position, branch, checkInTime, checkOutTime } =
      workerData;

    console.log(name, phone, position, branch);
    console.log(req.body);

    if (!name || !phone || !position || !branch) {
      return response(res, 400, "Majburiy maydonlar to'ldirilishi kerak!");
    }

    const workerBranch = await findDocumentById(
      Branch,
      res,
      branch,
      "Ishchi uchun fillial topilmadi!"
    );

    if (!workerBranch) return;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (checkInTime && !timeRegex.test(checkInTime)) {
      return response(res, 400, "checkInTime noto'g'ri formatda! (HH:mm)");
    }
    if (checkOutTime && !timeRegex.test(checkOutTime)) {
      return response(res, 400, "checkOutTime noto'g'ri formatda! (HH:mm)");
    }

    const existingWorker = await Worker.findOne({ phone });
    if (existingWorker) {
      return response(
        res,
        400,
        "Bu telefon raqam allaqachon ro'yxatdan o'tgan!"
      );
    }

    const newWorker = new Worker({
      name,
      phone,
      position,
      branch,
      salary: workerData.salary || 0,
      penalty: workerData.penalty || 0,
      finePerMinute: workerData.finePerMinute || 300,
      autoFine: workerData.autoFine ?? false,
      fixedHours: workerData.fixedHours ?? false,
      checkInTime,
      checkOutTime,
    });

    await newWorker.save();

    return response(res, 201, null, {
      message: "Ishchi muvaffaqiyatli qo'shildi!",
      worker: newWorker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Barcha ishchilarni olish
const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().populate("branch");

    return response(res, 200, null, { count: workers.length, workers });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 ID bo‘yicha ishchini olish
const getWorkerById = async (req, res) => {
  try {
    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    await worker.populate("branch");

    return response(res, 200, null, {
      worker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ishchini yangilash
const updateWorker = async (req, res) => {
  try {
    if (!Object.keys(req.body).length)
      return response(
        res,
        200,
        "Yangilash uchun ishchi ma'lumotlari berilmadi!"
      );

    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedWorker) return response(res, 404, "Ishchi topilmadi!");

    return response(res, 200, null, {
      message: "Ishchi ma'lumoti muvaffaqiyatli yangilandi!",
      worker: updatedWorker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ishchini o'chirish
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return response(res, 404, "Ishchi topilmadi!");

    return response(res, 200, null, { message: "Ishchi o'chirildi!" });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

//* 2️⃣ WORKER ACTIONS

// 📌 Ish kunini qo‘shish
const addWorkDay = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { $push: { workDays: req.body } },
      { new: true }
    );

    if (!worker) return response(res, 404, "Ishchi topilmadi!");

    return response(res, 201, null, {
      message: "Ish kuni muvaffaqqiyatli qo'shildi!",
      worker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ruxsat (ta'til) qo‘shish
const addLeave = async (req, res) => {
  try {
    if (!Object.keys(req.body).length)
      return response(
        res,
        400,
        "Ta'til berish uchun barcha ma'lumotlarni kiriting!"
      );

    const { start, end, reason, type } = req.body;

    if (!start || !end || !type)
      return response(
        res,
        400,
        "Ta'til berish uchun barcha ma'lumotlarni kiriting!"
      );

    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    // ? 📌 Agar bu kunga ta'til belgilangan bo'lsa, xatolik qaytarish
    const existingLeave = worker.leaves.find((leave) => {
      return (
        (startDate >= new Date(leave.start) &&
          startDate <= new Date(leave.end)) ||
        (endDate >= new Date(leave.start) && endDate <= new Date(leave.end)) ||
        (startDate <= new Date(leave.start) && endDate >= new Date(leave.end))
      );
    });

    if (existingLeave)
      return response(res, 400, "Ushbu sanaga allaqachon ta'til belgilangan!");

    // ? 📌 Agar bu sana dam olish kuni bo'lsa, ta'til berilmasin
    const isHoliday = await Holiday.findOne({
      date: { $gte: startDate, $lte: endDate },
    });

    if (isHoliday)
      return response(
        res,
        400,
        "Ushbu sana dam olish kuni sifatida belgilangan!"
      );

    // ? 📌 Eski ta'tillarni avtomatik tozalash
    worker.leaves = worker.leaves.filter(
      (leave) => new Date(leave.end) >= today
    );

    // ? 📌 Yangi ta'til qo'shish
    worker.leaves.push({
      start,
      end,
      reason,
      type,
    });

    await worker.save();

    return response(res, 201, null, {
      message: "Ishchi uchun ta'til muvaffaqiyatli qo'shildi!",
      worker,
    });
  } catch (error) {
    console.log(error);
    return response(res, 500, error.message);
  }
};

// 📌 Jarima qo‘shish
const addFine = async (req, res) => {
  try {
    const { amount, reason, date } = req.body;

    if (!amount || !reason || !date) {
      return response(res, 400, "Barcha maydonlarni to'ldiring!");
    }

    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const fineDate = new Date(date);
    if (fineDate < new Date().setHours(0, 0, 0, 0)) {
      return response(res, 400, "O'tgan sana uchun jarima qo'shib bo'lmaydi!");
    }

    worker.fines.push({ amount, reason, date: fineDate });

    worker.penalty += amount;
    await worker.save();

    return response(res, 201, null, {
      message: "Jarima muvaffaqiyatli qo'shildi!",
      worker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ishchi oyligini hisoblash
const calculateSalary = async (req, res) => {
  try {
    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const totalFines = worker.fines.reduce((sum, fine) => sum + fine.amount, 0);
    const finalSalary = Math.max(worker.salary - totalFines, 0);

    return response(res, 200, null, {
      salary: worker.salary,
      fines: totalFines,
      finalSalary,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

//* 3️⃣ WORKER ARRIVAL

// 📌 Ishchi keldi
const checkIn = async (req, res) => {
  try {
    let checkInTime;

    // Get checkInTime from request or use current time
    if (req.body && req.body.checkInTime) {
      checkInTime = req.body.checkInTime;
    } else {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      checkInTime = `${hours}:${minutes}`;
    }

    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD" formatga o'tkazamiz

    // 📌 1. Bayram ekanligini tekshiramiz
    const isHoliday = await Holiday.findOne({ date: todayStr });
    console.log("Bugun:", todayStr, "| Bayram bormi?:", isHoliday);

    if (isHoliday) {
      return response(res, 400, "Bugun ishchilar uchun dam olish kuni.");
    }

    // 📌 2. Ishchi allaqachon check-in qilganmi?
    let workDay = worker.workDays.find((day) => {
      return day.date.toISOString().split("T")[0] === todayStr; // ✅ To‘g‘ri taqqoslash
    });

    console.log("Bugungi ish kuni topildimi?", workDay);

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(checkInTime)) {
      return response(res, 400, "Vaqt formati noto'g'ri! (HH:mm)");
    }

    // Check if worker has already checked in today
    if (workDay && workDay.checkIn) {
      return response(res, 400, "Ishchi bugun allaqachon kelgan!");
    }

    // Simple string comparison for times
    if (worker.checkOutTime && checkInTime > worker.checkOutTime) {
      if (
        worker.checkOutTime < worker.checkInTime &&
        checkInTime > worker.checkInTime
      ) {
        // Valid check-in for night shift
      } else {
        return response(res, 400, "Ish vaqti tugagan!");
      }
    }

    if (!workDay) {
      workDay = {
        date: today,
        checkIn: checkInTime,
        checkOut: null,
      };
      worker.workDays.push(workDay);
    } else {
      workDay.checkIn = checkInTime;
    }

    worker.isPresent = true;

    const lateMinutes = calculateMinutes(worker.checkInTime, checkInTime);

    if (lateMinutes > 0) {
      const hasLeave = worker.leaves.some((leave) => {
        const leaveStart = new Date(leave.start).setHours(0, 0, 0, 0);
        const leaveEnd = new Date(leave.end).setHours(0, 0, 0, 0);
        return today >= leaveStart && today <= leaveEnd;
      });

      if (!hasLeave) {
        worker.isLate = true;
        workDay.lateMinutes = lateMinutes;

        if (worker.autoFine) {
          const fineAmount = lateMinutes * worker.finePerMinute;
          worker.fines.push({
            amount: fineAmount,
            date: new Date(),
            reason: "Kech kelish",
          });
          worker.penalty += fineAmount;
        }
      }
    }

    await worker.save();

    return response(res, 200, null, {
      message: "Ishchi kelganligi qayd etildi!",
      worker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ishchi ketdi
const checkOut = async (req, res) => {
  try {
    let checkOutTime;

    // Get checkOutTime from request or use current time
    if (req.body && req.body.checkOutTime) {
      checkOutTime = req.body.checkOutTime;
    } else {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      checkOutTime = `${hours}:${minutes}`;
    }

    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugungi kunni faqat sanasi bilan olish

    let workDay = worker.workDays.find(
      (day) => new Date(day.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (!workDay) {
      return response(
        res,
        400,
        "Ishchi bugun kelmagan, shuning uchun ketish vaqtini belgilash mumkin emas!"
      );
    }

    // Check if worker has already checked out today
    console.log(workDay.checkOut);
    console.log(workDay);
    if (workDay.checkOut) {
      return response(res, 400, "Ishchi allaqachon ketgan!");
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(checkOutTime)) {
      return response(res, 400, "Vaqt formati noto'g'ri! (HH:mm)");
    }

    workDay.checkOut = checkOutTime;
    worker.isPresent = false;
    worker.isGone = true;

    // Worker's designated checkout time
    const fixedCheckOut = worker.checkOutTime || "18:00"; // Default to 18:00 if not set

    const earlyMinutes = calculateMinutes(checkOutTime, fixedCheckOut);

    // If worker left early
    if (earlyMinutes > 0) {
      const hasLeave = worker.leaves.some((leave) => {
        const leaveStart = new Date(leave.start).setHours(0, 0, 0, 0);
        const leaveEnd = new Date(leave.end).setHours(0, 0, 0, 0);
        return today >= leaveStart && today <= leaveEnd;
      });

      if (!hasLeave) {
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

    return response(res, 200, null, {
      message: "Ishchi ketganligi qayd etildi!",
      worker,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ishchi tashqarida
const outside = async (req, res) => {
  try {
    const { location } = req.body;
    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const branch = await findDocumentById(
      Branch,
      res,
      worker.branch,
      "Filial topilmadi!"
    );
    if (!branch) return;

    const distance = getDistance(location, branch.location);
    const isOutside = distance > branch.radius;

    if (isOutside) {
      worker.isOutside = true;
      worker.penalty += worker.finePerMinute;
      await worker.save();
    } else {
      worker.isOutside = false;
    }

    return response(res, 200, null, {
      message: "Ishchi joylashuvi tekshirildi!",
      isOutside,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

module.exports = {
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
};
