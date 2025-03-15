const { default: mongoose } = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\+998[0-9]{9}$/,
        "Telefon raqami noto'g'ri formatda! (+998XXXXXXXXX)",
      ],
    },
    checkInTime: {
      type: String,
      default: null,
    },
    checkOutTime: {
      type: String,
      default: null,
    },
    position: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    salary: { type: Number, default: 0, min: 0 },
    penalty: { type: Number, default: 0, min: 0 },
    finePerMinute: { type: Number, default: 300, min: 0 },
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
        lateMinutes: { type: Number, default: 0, min: 0 },
        leftEarlyMinutes: { type: Number, default: 0, min: 0 },
        absent: { type: Boolean, default: false },
      },
    ],

    fines: [
      {
        date: { type: Date, required: true, default: Date.now() },
        amount: { type: Number, required: true, min: 1 },
        // reason: { type: String, required: true },
      },
    ],

    leaves: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        reason: { type: String, default: "" },
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
