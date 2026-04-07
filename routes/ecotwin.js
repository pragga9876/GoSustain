const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const averages = require("../data/ecotwinAverages");

// Use your existing Activity model:
const Activity = require("../models/activity");

// Helper: calculate weekly footprint
async function getWeeklyCO2(userId) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const acts = await Activity.find({ user: userId, date: { $gte: since } }).lean();
  return acts.reduce((sum, a) => sum + Number(a.co2 || 0), 0);
}

router.get("/api/ecotwin", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;

    // REQUIRED user fields (store them once in profile page)
    const age = user.age || 20;
    const state = user.state || "West Bengal";
    const lifestyle = user.lifestyle || "student-home";

    // Compute weekly footprint
    const weekly = await getWeeklyCO2(user._id);

    // Age group
    let ageGroup = "18-25";
    if (age >= 26 && age <= 35) ageGroup = "26-35";
    else if (age >= 36 && age <= 50) ageGroup = "36-50";
    else if (age > 50) ageGroup = "50+";

    const avgAge = averages.ageGroups[ageGroup] || 60;
    const avgState = averages.states[state] || 70;
    const avgLifestyle = averages.lifestyle[lifestyle] || 65;

    res.json({
      success: true,
      you: weekly,
      compare: {
        byAge: avgAge,
        byState: avgState,
        byLifestyle: avgLifestyle
      },
      details: {
        ageGroup,
        state,
        lifestyle
      }
    });

  } catch (err) {
    console.error("EcoTwin error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
