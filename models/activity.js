const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["travel", "energy", "diet", "waste", "carbon"],
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  co2: {
    type: Number,
    default: 0,
  },

  /* --- Travel fields --- */
  mode: {
    type: String,
    default: "",
  },
  distance: {
    type: Number,
    default: 0,
  },
  vehicleType: {
    type: String,
    default: "",
  },
  flightKm: {
    type: Number,
    default: 0,
  },
  busKm: {
    type: Number,
    default: 0,
  },
  trainKm: {
    type: Number,
    default: 0,
  },
  bikeKm: {
    type: Number,
    default: 0,
  },

  /* --- Energy fields --- */
  kwh: {
    type: Number,
    default: 0,
  },
  householdSize: {
    type: Number,
    default: 1,
  },
  energySource: {
    type: String,
    default: "",
  },
  heatingFuel: {
    type: String,
    default: "",
  },
  lpgCylinders: {
    type: Number,
    default: 0,
  },
  waterUsage: {
    type: Number,
    default: 0,
  },

  /* --- Diet fields --- */
  dietType: {
    type: String,
    default: "",
  },
  meatFrequency: {
    type: String,
    default: "",
  },
  localFoodPercentage: {
    type: Number,
    default: 0,
  },
  foodWaste: {
    type: String,
    default: "",
  },

  /* --- Waste fields --- */
  weeklyWasteKg: {
    type: Number,
    default: 0,
  },
  recycle: {
    type: Boolean,
    default: false,
  },
  compost: {
    type: Boolean,
    default: false,
  },

  /* --- Full calculator details --- */
  details: {
    type: Object,
    default: {},
  },

  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);