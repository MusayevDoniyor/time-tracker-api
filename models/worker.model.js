const { default: mongoose } = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+998[0-9]{9}$/, "Invalid phone number format"],
    },
    position: { type: String, required: true, trim: true },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    salary: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    finePerMinute: { type: Number, default: 0 },
    autoFine: { type: Boolean, default: false },
    fixedHours: { type: Boolean, default: false },

    isLate: { type: Boolean, default: false },
    isPresent: { type: Boolean, default: false },
    isOutside: { type: Boolean, default: false },

    workDays: [
      {
        date: { type: Date, required: true },
        checkIn: { type: String, default: null },
        checkOut: { type: String, default: null },
        lateMinutes: { type: Number, default: 0 },
        leftEarlyMinutes: { type: Number, default: 0 },
        absent: { type: Boolean, default: false },
      },
    ],

    fines: [
      {
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        // reason: { type: String, required: true },
      },
    ],

    leaves: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        reason: { type: String, required: true },
        type: {
          type: String,
          enum: ["ta'til", "kasallik", "shaxsiy sabab"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker;
