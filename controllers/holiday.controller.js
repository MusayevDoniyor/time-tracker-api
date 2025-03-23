const Holiday = require("../models/holiday.model");
const { deleteExpiredHolidays } = require("../utils/helper");
const response = require("../utils/response");

const getHolidays = async (req, res) => {
  try {
    // Delete expired holidays first
    const deletedCount = await deleteExpiredHolidays(Holiday);

    // Get query parameters for filtering
    const { year, month } = req.query;
    const query = {};

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get holidays with optional filtering
    const holidays = await Holiday.find(query).sort({ date: 1 });

    // Calculate current month's Sundays if needed
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const defaultSundays = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    // Find all Sundays in the current month
    for (let i = 0; i < 31; i++) {
      const day = new Date(currentYear, currentMonth, i + 1);
      if (day.getMonth() !== currentMonth) break;
      if (day.getDay() === 0) {
        defaultSundays.push(day.toISOString().split("T")[0]);
      }
    }

    return response(res, 200, null, {
      count: holidays.length,
      holidays,
      deletedExpiredCount: deletedCount,
      defaultSundays: defaultSundays,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const deleteExpired = async (req, res) => {
  try {
    const deletedCount = await deleteExpiredHolidays(Holiday);

    return response(res, 200, null, {
      message: `${deletedCount} ta o'tib ketgan bayramlar o'chirildi`,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const createHoliday = async (req, res) => {
  try {
    const {
      holidays,
      name = "Bayram",
      description = "",
      isNationalHoliday = true,
    } = req.body;

    // Validate input
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
      return response(
        res,
        400,
        "Bayram sanalari kerak va array bo'lishi shart!"
      );
    }

    // Process dates to ensure they're in the correct format
    const processedDates = [];
    for (const dateStr of holidays) {
      const date = new Date(dateStr);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return response(res, 400, `Noto'g'ri sana formati: ${dateStr}`);
      }

      processedDates.push(date);
    }
    // Check for existing holidays
    const existingHolidays = await Holiday.find({
      date: { $in: processedDates },
    });

    if (existingHolidays.length > 0) {
      return response(
        res,
        400,
        `Quyidagi bayram sanalari allaqachon mavjud: ${existingHolidays
          .map((h) => h.date.toISOString().split("T")[0])
          .join(", ")}`
      );
    }

    // Add new holidays
    const newHolidays = processedDates.map((date) => ({
      date,
      name,
      description,
      isNationalHoliday,
    }));

    const savedHolidays = await Holiday.insertMany(newHolidays);

    return response(res, 201, null, {
      message: "Bayramlar muvaffaqiyatli qo'shildi!",
      holidays: savedHolidays,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return response(res, 404, "Bayram topilmadi");

    return response(res, 200, null, holiday);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const updateHoliday = async (req, res) => {
  try {
    // Validate the date if provided
    if (req.body.date) {
      req.body.date = new Date(req.body.date);
    }

    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedHoliday) return response(res, 404, "Bayram topilmadi");

    return response(res, 200, null, updatedHoliday);
  } catch (error) {
    return response(res, 500, error.message);
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const deletedHoliday = await Holiday.findByIdAndDelete(req.params.id);
    if (!deletedHoliday) return response(res, 404, "Bayram topilmadi");

    return response(res, 200, null, { message: "Bayram o'chirildi" });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

module.exports = {
  getHolidays,
  deleteExpired,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};
