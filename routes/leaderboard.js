// routes/leaderboard.js
const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");
const User = require("../models/user");

// Helper: start of current week (last 7 days)
function getStartOfWindow(days = 7) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

// Route: leaderboard (last 7 days, least CO2)
router.get("/leaderboard", async (req, res) => {
  try {
    const start = getStartOfWindow(7);

    // Aggregate per user sum of co2 for last 7 days
    const agg = await Activity.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: "$user", weeklyCO2: { $sum: "$co2" } } },
      { $sort: { weeklyCO2: 1 } },
      { $limit: 5 }
    ]);

    // Get users' lastCalculation too
    const userIds = agg.map(x => x._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("username badges badgesEarned lastCalculation");

    // map user id -> user object
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const leaderboard = agg.map(x => {
  const u = userMap[x._id.toString()] || {};
  return {
    userId: x._id,
    username: u.username || "Unknown",
    weeklyCO2: x.weeklyCO2 || 0,
    badgesEarned: u.badgesEarned || 0,
    badges: u.badges || []   // <-- add actual badge objects
  };
});


    res.render("leaderboard", {
      title: "Leaderboard | EcoTrack",
      pageCSS: ["leaderboard"],
      currentUser: req.user,
      leaderboard
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    req.flash("error", "Failed to load leaderboard");
    res.redirect("/");
  }
});

module.exports = router;
