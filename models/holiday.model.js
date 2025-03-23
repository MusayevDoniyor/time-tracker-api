const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    date: { type: Date, required: true, unique: true },
    description: { type: String, default: "" },
    isNationalHoliday: { type: Boolean, default: true },
  },
  { timestamps: true }
);

holidaySchema.virtual("isExpired").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.date < today;
});

module.exports = mongoose.model("Holiday", holidaySchema);
