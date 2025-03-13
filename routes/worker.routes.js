const Worker = require("../models/worker.model");

const router = require("express").Router();

router.post("/", async (req, res) => {
  try {
    const newWorker = new Worker(req.body);
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.status(200).json({ count: workers.length, workers });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Ischi topilmadi" });

    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedWorker)
      return res.status(404).json({ message: "Ishchi topilmadi" });

    res.status(200).json(updatedWorker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedWorker = await Worker.findByIdAndDelete(req.params.id);

    if (!deletedWorker)
      return res.status(404).json({ message: "Ishchi topilmadi" });

    res.json({ message: "Ishchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Ish kunlarini qo'shish
router.post("/:id/workday", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        $push: { workDays: req.body },
      },
      { new: true }
    );
    if (!worker) return res.status(404).json({ message: "Ishchi topilmadi" });

    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/leave", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        $push: { leaves: req.body },
      },
      { new: true }
    );
    if (!worker) return res.status(404).json({ message: "Ishchi topilmadi" });

    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/fine", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Ishchi topilmadi" });

    worker.fines.push(req.body);
    await worker.save();
    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/salary", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Ishchi topilmadi" });

    let totalFines = worker.fines.reduce((sum, fine) => sum + fine.amount, 0);
    let finalSalary = worker.salary - totalFines;

    res
      .status(200)
      .json({ salary: worker.salary, fines: totalFines, finalSalary });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
