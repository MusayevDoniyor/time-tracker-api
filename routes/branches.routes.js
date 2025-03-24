const express = require("express");
const {
  getBranches,
  createBranch,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("../controllers/branch.controller");

const router = express.Router();

// 📌 Barcha filiallarni olish
router.get("/", getBranches);

// 📌 Yangi filial qo'shish
router.post("/", createBranch);

// 📌 Filialni ID bo'yicha olish
router.get("/:id", getBranchById);

// 📌 Filialni yangilash
router.put("/:id", updateBranch);

// 📌 Filialni o'chirish
router.delete("/:id", deleteBranch);

module.exports = router;
