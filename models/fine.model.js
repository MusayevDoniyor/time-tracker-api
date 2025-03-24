const { default: mongoose } = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: { type: Number, required: true, min: 1 },
    reason: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const Fine = mongoose.model("Fine", fineSchema);

module.exports = Fine;
