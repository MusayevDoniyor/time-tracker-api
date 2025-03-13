const Holiday = require("../models/holiday.model");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const holidays = await Holiday.find();

  res.status(200).json({ count: holidays.length, holidays });
});

router.post("/", async (req, res) => {
  const newHoliday = new Holiday(req.body);
  await newHoliday.save();

  res.status(201).json({ newHoliday });
});

module.exports = router;
