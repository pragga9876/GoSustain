const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      enum: ["Amazon", "Flipkart", "Manual", "Receipt"],
      required: true,
      default: "Manual",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },

    estimatedCarbonKg: {
      type: Number,
      default: 0,
      min: 0,
    },

    greenerAlternative: {
      type: String,
      trim: true,
      default: "",
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);