// models/redemption.js
const mongoose = require("mongoose");

const redemptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "MarketItem", required: true },
  pointsSpent: { type: Number, required: true },
  message: String, // optional user note
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Redemption", redemptionSchema);
