const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchName: { type: String, required: true, trim: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    radius: { type: Number, default: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);
