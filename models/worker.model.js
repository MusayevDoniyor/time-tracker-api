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
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Ish vaqti noto'g'ri formatda! (HH:mm)",
      ],
    },
    checkOutTime: {
      type: String,
      default: null,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Ish vaqti noto'g'ri formatda! (HH:mm)",
      ],
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
    isGone: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker;
