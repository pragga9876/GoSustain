const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ADD "carbon" so calculator results can be saved
  type: {
    type: String,
    enum: ["travel", "energy", "diet", "carbon"],
    required: true,
  },

  description: String,

  // CO₂ emission value
  co2: { type: Number, default: 0 },

  /* --- Travel fields --- */
  mode: String,       
  distance: Number,   

  /* --- Energy fields --- */
  kwh: Number,        

  /* --- Diet fields --- */
  dietType: String,   

  /* --- Carbon Calculator can store full details --- */
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