const mongoose = require("mongoose");

const calculationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  travel: {
    carKm: { type: Number, default: 0 },
    bikeKm: { type: Number, default: 0 },
    busKm: { type: Number, default: 0 },
    trainKm: { type: Number, default: 0 },
    flightKm: { type: Number, default: 0 },
    vehicleType: { type: String, default: "" }
  },

  home: {
    electricityKwh: { type: Number, default: 0 },
    householdSize: { type: Number, default: 1 },
    energySource: { type: String, default: "" },
    heatingFuel: { type: String, default: "" },
    lpgCylinders: { type: Number, default: 0 },
    waterUsage: { type: Number, default: 0 }
  },

  food: {
    dietType: { type: String, default: "" },
    meatFrequency: { type: String, default: "" },
    localFoodPercentage: { type: Number, default: 0 },
    foodWaste: { type: String, default: "" }
  },

  waste: {
    weeklyWasteKg: { type: Number, default: 0 },
    recycle: { type: Boolean, default: false },
    compost: { type: Boolean, default: false }
  },

  breakdown: {
    travel: { type: Number, default: 0 },
    home: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    waste: { type: Number, default: 0 }
  },

  totalCarbon: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.Calculation || mongoose.model("Calculation", calculationSchema);