const { default: mongoose } = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchName: { type: String, required: true, trim: true },
    location: {
      latitude: { type: Number, required: true },
      longtitude: { type: Number, required: true },
    },
    radius: { type: Number, default: 100 },
    //   workHours: {
    //     start: { type: String, required: true },
    //     end: { type: String, required: true },
    //   },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);
