const { default: mongoose } = require("mongoose");

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("Holiday", holidaySchema);
