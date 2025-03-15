const express = require("express");
const Holiday = require("../models/holiday.model");

const router = express.Router();

// 📌 Barcha bayramlarni olish
router.get("/", async (req, res) => {
  try {
    const holidays = await Holiday.find();
    res.status(200).json({ count: holidays.length, holidays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Yangi bayram qo‘shish
router.post("/", async (req, res) => {
  try {
    const { name, date } = req.body;

    // **Majburiy maydonlarni tekshirish**
    if (!name || !date) {
      return res
        .status(400)
        .json({ error: "Bayram nomi va sanasi talab qilinadi!" });
    }

    // **Takroriy bayram borligini tekshirish**
    const existingHoliday = await Holiday.findOne({ date });
    if (existingHoliday) {
      return res
        .status(400)
        .json({ error: "Bu sana allaqachon bayram sifatida qo'shilgan!" });
    }

    const newHoliday = new Holiday({ name, date });
    await newHoliday.save();
    res.status(201).json({
      message: "Bayram muvaffaqiyatli qo'shildi!",
      holiday: newHoliday,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Bayramni ID bo‘yicha olish
router.get("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ error: "Bayram topilmadi" });

    res.status(200).json(holiday);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Bayramni yangilash
router.put("/:id", async (req, res) => {
  try {
    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedHoliday)
      return res.status(404).json({ error: "Bayram topilmadi" });

    res.status(200).json(updatedHoliday);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Bayramni o‘chirish
router.delete("/:id", async (req, res) => {
  try {
    const deletedHoliday = await Holiday.findByIdAndDelete(req.params.id);
    if (!deletedHoliday)
      return res.status(404).json({ error: "Bayram topilmadi" });

    res.json({ message: "Bayram o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
