const express = require("express");
const Branch = require("../models/branch.model");

const router = express.Router();

// 📌 Barcha filiallarni olish
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json({ count: branches.length, branches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Yangi filial qo'shish
router.post("/", async (req, res) => {
  try {
    const { branchName, location, radius } = req.body;

    if (!branchName || !location?.latitude || !location?.longitude) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    // Branch nomi takrorlanmasligini tekshirish
    const existingBranch = await Branch.findOne({ branchName });
    if (existingBranch) {
      return res
        .status(400)
        .json({ error: "Bu nomdagi filial allaqachon mavjud!" });
    }

    const newBranch = new Branch({
      branchName,
      location,
      radius: radius || 100, // Default qiymat
    });

    await newBranch.save();
    res
      .status(201)
      .json({ message: "Filial muvaffaqiyatli qo'shildi!", branch: newBranch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Filialni ID bo'yicha olish
router.get("/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ error: "Filial topilmadi" });

    res.status(200).json(branch);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Noto'g'ri ID formati!" });
    }
    res.status(500).json({ error: error.message });
  }
});

// 📌 Filialni yangilash
router.put("/:id", async (req, res) => {
  try {
    const { branchName, location, radius } = req.body;
    const updateData = {};
    if (branchName) updateData.branchName = branchName;
    if (location?.latitude && location?.longitude)
      updateData.location = location;
    if (radius) updateData.radius = radius;

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBranch)
      return res.status(404).json({ error: "Filial topilmadi" });

    res.status(200).json(updatedBranch);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Noto'g'ri ID formati!" });
    }
    res.status(500).json({ error: error.message });
  }
});

// 📌 Filialni o'chirish
router.delete("/:id", async (req, res) => {
  try {
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);
    if (!deletedBranch)
      return res.status(404).json({ error: "Filial topilmadi" });

    res.json({ message: "Filial o'chirildi" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Noto'g'ri ID formati!" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
