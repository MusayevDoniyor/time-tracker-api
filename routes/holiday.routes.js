const express = require("express");
const {
  getHolidays,
  deleteExpired,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
} = require("../controllers/holiday.controller");

const router = express.Router();

/**
 * Get all holidays with optional filtering
 * Automatically cleans up expired holidays
 */
router.get("/", getHolidays);

/**
 * Explicitly delete all expired holidays
 */
router.delete("/expired", deleteExpired);

/**
 * Add new holidays
 */
router.post("/", createHoliday);

/**
 * Get holiday by ID
 */
router.get("/:id", getHolidayById);

/**
 * Update holiday
 */
router.put("/:id", updateHoliday);

/**
 * Delete holiday by ID
 */
router.delete("/:id", deleteHoliday);

module.exports = router;
