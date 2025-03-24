const { default: mongoose } = require("mongoose");

const workDaySchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    lateMinutes: { type: Number, default: 0, min: 0 },
    leftEarlyMinutes: { type: Number, default: 0, min: 0 },
    absent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const WorkDay = mongoose.model("WorkDay", workDaySchema);

module.exports = WorkDay;
