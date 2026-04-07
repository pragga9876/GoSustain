const mongoose = require("mongoose");

const calculationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 1️⃣ Travel
  travel: {
    carKm: Number,
    bikeKm: Number,
    busKm: Number,
    trainKm: Number,
    flightHours: Number
  },

  // 2️⃣ Home Energy
  home: {
    electricityKwh: Number,
    lpgCylinders: Number,
    waterUsage: Number
  },

  // 3️⃣ Food & Diet
  food: {
    dietType: String,            // omnivore / vegetarian / vegan
    meatFrequency: String,       // daily / weekly / rarely
    localFoodPercentage: Number
  },

  // 4️⃣ Waste & Recycling
  waste: {
    weeklyWasteKg: Number,
    recycle: Boolean,
    compost: Boolean
  },

  totalCarbon: Number, // Calculated using utils/calculatecarbon.js
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Calculation", calculationSchema);
