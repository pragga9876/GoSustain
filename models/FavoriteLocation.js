const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FavoriteLocation", favoriteSchema);
