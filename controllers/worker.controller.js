const Worker = require("../models/worker.model");
const WorkDay = require("../models/workDay.model");
const Fine = require("../models/fine.model");
const Leave = require("../models/leave.model");
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

// 📌 ID bo'yicha ishchini olish
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

    // Get related data
    const workDays = await WorkDay.find({ worker: worker._id }).sort({
      date: -1,
    });
    const fines = await Fine.find({ worker: worker._id }).sort({ date: -1 });
    const leaves = await Leave.find({ worker: worker._id }).sort({ start: -1 });

    // Add the related data to the response
    const workerData = worker.toObject();
    workerData.workDays = workDays;
    workerData.fines = fines;
    workerData.leaves = leaves;

    return response(res, 200, null, {
      worker: workerData,
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

    // Delete related data
    await WorkDay.deleteMany({ worker: req.params.id });
    await Fine.deleteMany({ worker: req.params.id });
    await Leave.deleteMany({ worker: req.params.id });

    return response(res, 200, null, { message: "Ishchi o'chirildi!" });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

//* 2️⃣ WORKER ACTIONS

// 📌 Ish kunini qo'shish
const addWorkDay = async (req, res) => {
  try {
    const worker = await findDocumentById(
      Worker,
      res,
      req.params.id,
      "Ishchi topilmadi!"
    );
    if (!worker) return;

    const { date, checkIn, checkOut, lateMinutes, leftEarlyMinutes, absent } =
      req.body;

    // Check if a workday already exists for this date
    const existingWorkDay = await WorkDay.findOne({
      worker: worker._id,
      date: new Date(date),
    });

    if (existingWorkDay) {
      return response(res, 400, "Bu sana uchun ish kuni allaqachon mavjud!");
    }

    const newWorkDay = new WorkDay({
      worker: worker._id,
      date: date || new Date(),
      checkIn,
      checkOut,
      lateMinutes: lateMinutes || 0,
      leftEarlyMinutes: leftEarlyMinutes || 0,
      absent: absent || false,
    });

    await newWorkDay.save();

    return response(res, 201, null, {
      message: "Ish kuni muvaffaqqiyatli qo'shildi!",
      workDay: newWorkDay,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Ruxsat (ta'til) qo'shish
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
    const existingLeave = await Leave.findOne({
      worker: worker._id,
      $or: [
        { start: { $lte: endDate }, end: { $gte: startDate } },
        { start: { $gte: startDate }, end: { $lte: endDate } },
      ],
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

    // ? 📌 Yangi ta'til qo'shish
    const newLeave = new Leave({
      worker: worker._id,
      start,
      end,
      reason: reason || "",
      type,
    });

    await newLeave.save();

    return response(res, 201, null, {
      message: "Ishchi uchun ta'til muvaffaqiyatli qo'shildi!",
      leave: newLeave,
    });
  } catch (error) {
    console.log(error);
    return response(res, 500, error.message);
  }
};

// 📌 Jarima qo'shish
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

    const newFine = new Fine({
      worker: worker._id,
      amount,
      reason,
      date: fineDate,
    });

    await newFine.save();

    // Update worker's total penalty
    worker.penalty += amount;
    await worker.save();

    return response(res, 201, null, {
      message: "Jarima muvaffaqiyatli qo'shildi!",
      fine: newFine,
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

    // Get all fines for this worker
    const fines = await Fine.find({ worker: worker._id });
    const totalFines = fines.reduce((sum, fine) => sum + fine.amount, 0);
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
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD" formatga o'tkazamiz

    // 📌 1. Bayram ekanligini tekshiramiz
    const isHoliday = await Holiday.findOne({ date: todayStr });
    console.log("Bugun:", todayStr, "| Bayram bormi?:", isHoliday);

    if (isHoliday) {
      return response(res, 400, "Bugun ishchilar uchun dam olish kuni.");
    }

    // 📌 2. Ishchi allaqachon check-in qilganmi?
    // Find today's workDay
    let workDay = await WorkDay.findOne({
      worker: worker._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
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
      // Create a new workDay
      workDay = new WorkDay({
        worker: worker._id,
        date: today,
        checkIn: checkInTime,
        checkOut: null,
        absent: false, // Mark as not absent since they checked in
      });
    } else {
      // Update existing workDay
      workDay.checkIn = checkInTime;
      workDay.absent = false; // Mark as not absent since they checked in
    }

    // Reset previous status flags to ensure clean state
    worker.isGone = false;
    worker.isPresent = true;
    worker.isLate = false; // Reset late status before checking

    // Fix: Calculate late minutes correctly using your existing function
    if (worker.checkInTime) {
      // If worker has a fixed check-in time
      // Your calculateMinutes function already returns positive values only
      const lateMinutes = calculateMinutes(worker.checkInTime, checkInTime);

      if (lateMinutes > 0) {
        // Check if worker has leave for today
        const hasLeave = await Leave.findOne({
          worker: worker._id,
          start: { $lte: today },
          end: { $gte: today },
        });

        if (!hasLeave) {
          worker.isLate = true;
          workDay.lateMinutes = lateMinutes;

          if (worker.autoFine) {
            const fineAmount = lateMinutes * worker.finePerMinute;

            // Create a new fine
            const newFine = new Fine({
              worker: worker._id,
              amount: fineAmount,
              date: new Date(),
              reason: "Kech kelish",
            });

            await newFine.save();
            worker.penalty += fineAmount;
          }
        }
      }
    }

    await workDay.save();
    await worker.save();

    return response(res, 200, null, {
      message: "Ishchi kelganligi qayd etildi!",
      worker,
      workDay,
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
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Find today's workDay
    const workDay = await WorkDay.findOne({
      worker: worker._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!workDay) {
      return response(
        res,
        400,
        "Ishchi bugun kelmagan, shuning uchun ketish vaqtini belgilash mumkin emas!"
      );
    }

    // Check if worker has already checked out today
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

    // For early minutes, we need to swap the parameters since your function
    // only returns positive values
    if (worker.checkOutTime) {
      const leftEarlyMinutes = calculateMinutes(checkOutTime, fixedCheckOut);

      if (leftEarlyMinutes > 0) {
        // Check if worker has leave for today
        const hasLeave = await Leave.findOne({
          worker: worker._id,
          start: { $lte: today },
          end: { $gte: today },
        });

        if (!hasLeave) {
          workDay.leftEarlyMinutes = leftEarlyMinutes;

          if (worker.autoFine) {
            const fineAmount = leftEarlyMinutes * worker.finePerMinute;

            // Create a new fine
            const newFine = new Fine({
              worker: worker._id,
              amount: fineAmount,
              date: new Date(),
              reason: "Vaqtli ketish",
            });

            await newFine.save();
            worker.penalty += fineAmount;
          }
        }
      }
    }

    await workDay.save();
    await worker.save();

    return response(res, 200, null, {
      message: "Ishchi ketganligi qayd etildi!",
      worker,
      workDay,
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

      // Create a new fine
      const newFine = new Fine({
        worker: worker._id,
        amount: worker.finePerMinute,
        date: new Date(),
        reason: "Tashqarida",
      });

      await newFine.save();
      await worker.save();
    } else {
      worker.isOutside = false;
      await worker.save();
    }

    return response(res, 200, null, {
      message: "Ishchi joylashuvi tekshirildi!",
      isOutside,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Reset daily worker statuses
const resetDailyWorkerStatus = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugun dam olish kuni yoki yo‘qligini tekshiramiz
    const isHoliday = await Holiday.exists({
      date: today.toISOString().split("T")[0],
    });

    if (isHoliday) {
      console.log("Bugun dam olish kuni, ishchilar holati o‘zgartirilmaydi.");
      return {
        success: true,
        message: "Bugun dam olish kuni, ishchilar holati o‘zgartirilmaydi.",
      };
    }

    // Barcha ishchilarni olamiz
    const workers = await Worker.find({}, "_id");

    // Barcha ishchilarning `isLate`, `isPresent`, `isOutside`, `isGone` statuslarini false qilish
    await Worker.updateMany(
      {},
      {
        $set: {
          isLate: false,
          isPresent: false,
          isOutside: false,
          isGone: false,
        },
      }
    );

    // Bugun ta'tilda bo‘lgan ishchilarni topamiz
    const workerLeaves = await Leave.find({
      worker: { $in: workers.map((w) => w._id) },
      start: { $lte: today },
      end: { $gte: today },
    }).select("worker");

    // Ta'tilda bo‘lmagan ishchilar ro‘yxatini hosil qilamiz
    const workersWithoutLeave = workers
      .map((w) => w._id.toString())
      .filter(
        (id) => !workerLeaves.some((leave) => leave.worker.toString() === id)
      );

    // Bugun uchun mavjud `WorkDay` larni topamiz
    const existingWorkDays = await WorkDay.find({
      worker: { $in: workersWithoutLeave },
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).select("worker");

    // Bugun `WorkDay` mavjud bo‘lmagan ishchilar
    const newWorkDays = workersWithoutLeave.filter(
      (id) =>
        !existingWorkDays.some((workDay) => workDay.worker.toString() === id)
    );

    // Yangi `WorkDay` larni yaratish
    if (newWorkDays.length > 0) {
      const workDaysToInsert = newWorkDays.map((workerId) => ({
        worker: workerId,
        date: today,
        checkIn: null,
        checkOut: null,
        lateMinutes: 0,
        leftEarlyMinutes: 0,
        absent: true,
      }));
      await WorkDay.insertMany(workDaysToInsert);
    }

    console.log("Daily worker statuses reset successfully");
    return {
      success: true,
      message: "Daily worker statuses reset successfully",
    };
  } catch (error) {
    console.error("Error resetting daily worker statuses:", error);
    return { success: false, error: error.message };
  }
};

// 📌 Reset monthly worker statuses
const resetMonthlyWorkerStatus = async () => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Barcha ishchilarning penalty ni 0 ga o‘rnatish
    await Worker.updateMany({}, { $set: { penalty: 0 } });

    // 2. Barcha jarimalarni o‘chirish
    await Fine.deleteMany({});

    // 3. Muddatidan o‘tgan ruxsatlarni o‘chirish
    await Leave.deleteMany({ end: { $lt: today } });

    // 4. Oxirgi 30 kundan oldingi ish kunlarini o‘chirish
    await WorkDay.deleteMany({ date: { $lt: thirtyDaysAgo } });

    console.log("Monthly worker statuses reset successfully");
    return {
      success: true,
      message: "Monthly worker statuses reset successfully",
    };
  } catch (error) {
    console.error("Error resetting monthly worker statuses:", error);
    return { success: false, error: error.message };
  }
};

// 📌 Reset daily worker statuses endpoint
const resetDailyStatus = async (req, res) => {
  try {
    const result = await resetDailyWorkerStatus();

    if (result.success) {
      return response(res, 200, null, {
        message: result.message,
      });
    } else {
      return response(res, 500, result.error);
    }
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Reset monthly worker statuses endpoint
const resetMonthlyStatus = async (req, res) => {
  try {
    const result = await resetMonthlyWorkerStatus();

    if (result.success) {
      return response(res, 200, null, {
        message: result.message,
      });
    } else {
      return response(res, 500, result.error);
    }
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
  resetDailyStatus,
  resetMonthlyStatus,
};
