// scripts/initStreaks.js
const mongoose = require("mongoose");
const User = require("../models/user");
const Activity = require("../models/activity");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });

  const users = await User.find({});
  for (const u of users) {
    const lastActivity = await Activity.findOne({ user: u._id }).sort({ date: -1 });
    if (lastActivity) {
      // naive compute streak: if lastActivity within today -> set 1; else set 0
      u.streak = u.streak || {};
      u.streak.lastActivityAt = lastActivity.date;
      u.streak.current = 1; // or compute proper streak by scanning activities day-by-day
      await u.save({ validateBeforeSave: false });
      console.log("Updated streak for", u.email);
    }
  }
  console.log("Done");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
