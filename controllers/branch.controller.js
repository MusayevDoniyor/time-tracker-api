const Branch = require("../models/branch.model");
const Worker = require("../models/worker.model");
const findDocumentById = require("../utils/findDocument");
const response = require("../utils/response");

// 📌 Barcha filiallarni olish
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    return response(res, 200, null, { count: branches.length, branches });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Yangi filial qo'shish
const createBranch = async (req, res) => {
  try {
    const { branchName, location, radius } = req.body;

    if (!branchName || !location?.latitude || !location?.longitude) {
      return response(res, 400, "Barcha maydonlarni to'ldiring!");
    }

    // Branch nomi takrorlanmasligini tekshirish
    const existingBranch = await Branch.findOne({ branchName });
    if (existingBranch) {
      return response(res, 400, "Bu nomdagi filial allaqachon mavjud!");
    }

    const newBranch = new Branch({
      branchName,
      location,
      radius: radius || 100, // Default qiymat
    });

    await newBranch.save();

    return response(res, 201, null, {
      message: "Filial muvaffaqiyatli qo'shildi!",
      branch: newBranch,
    });
  } catch (error) {
    return response(res, 500, error.message);
  }
};

// 📌 Filialni ID bo'yicha olish
const getBranchById = async (req, res) => {
  try {
    const branch = await findDocumentById(
      Branch,
      res,
      req.params.id,
      "Filial topilmadi!"
    );
    if (!branch) return;

    return response(res, 200, null, { branch });
  } catch (error) {
    if (error.name === "CastError") {
      return response(res, 400, "Noto'g'ri ID formati!");
    }
    return response(res, 500, error.message);
  }
};

// 📌 Filialni yangilash
const updateBranch = async (req, res) => {
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

    if (!updatedBranch) {
      return response(res, 404, "Filial topilmadi!");
    }

    return response(res, 200, null, {
      message: "Filial muvaffaqiyatli yangilandi!",
      branch: updatedBranch,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return response(res, 400, "Noto'g'ri ID formati!");
    }
    return response(res, 500, error.message);
  }
};

// 📌 Filialni o'chirish
const deleteBranch = async (req, res) => {
  try {
    // Check if branch is used by any workers
    const workersUsingBranch = await Worker.findOne({ branch: req.params.id });
    if (workersUsingBranch) {
      return response(
        res,
        400,
        "Bu filial ishchilar tomonidan ishlatilmoqda. Avval ishchilarni boshqa filialga o'tkazing!"
      );
    }

    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);
    if (!deletedBranch) {
      return response(res, 404, "Filial topilmadi!");
    }

    return response(res, 200, null, { message: "Filial o'chirildi" });
  } catch (error) {
    if (error.name === "CastError") {
      return response(res, 400, "Noto'g'ri ID formati!");
    }
    return response(res, 500, error.message);
  }
};

module.exports = {
  getBranches,
  createBranch,
  getBranchById,
  updateBranch,
  deleteBranch,
};
