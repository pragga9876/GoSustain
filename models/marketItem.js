// models/marketItem.js
const mongoose = require("mongoose");

const marketItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  costPoints: { type: Number, required: true },
  externalLink: String, // optional: NGO page or more info
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MarketItem", marketItemSchema);
