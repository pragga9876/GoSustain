const mongoose = require("mongoose");

const lcaSchema = new mongoose.Schema({
  product: String,
  co2: Number,
  production: Number,
  transportation: Number,
  usage: Number,
  disposal: Number,
  grade: String,
  comparison: String,
  details: String,
  tips: [String],
  assumptions: [String],
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LCA", lcaSchema);