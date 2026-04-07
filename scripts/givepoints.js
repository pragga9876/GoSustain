// scripts/givePoints.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

async function run() {
  const db = process.env.MONGO_URI;
  await mongoose.connect(db);
  const res = await User.updateMany({}, { $inc: { points: 300 } });
  console.log("Updated users:", res.modifiedCount);
  process.exit(0);
}
run();
