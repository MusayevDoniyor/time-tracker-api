const { default: mongoose } = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    reason: { type: String, default: "" },
    type: {
      type: String,
      enum: ["ta'til", "kasallik", "shaxsiy sabab"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Leave;
