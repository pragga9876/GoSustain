const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const calculateCarbon = require("../utils/calculatecarbon.js");
const Activity = require("../models/activity");
const User = require("../models/user");
const { updateUserStreak } = require("../utils/streak");
const { generateBadges } = require("../utils/badges");
const { generateInsights } = require("../utils/insights");
const GLOBAL_AVERAGE = 70; // kg CO2/week (calculated from ecotwin averages)
// ---------------------------
// STEP 0 → Start Calculator
// ---------------------------
router.get("/calculator/start", isLoggedIn, (req, res) => {
  // Clear any existing calculator session data to ensure fresh calculation
  delete req.session.calc;
  delete req.session.calcResult;
  
  res.render("activities/co2calculator/startCalculator", {
    title: "Start Carbon Calculator",
    pageCSS: ["startCalculator"],
  });
});

// ---------------------------
// STEP 1 → Travel
// ---------------------------
router.get("/calculator/travel", isLoggedIn, (req, res) => {
  res.render("activities/co2calculator/travel&transportation", {
    title: "Travel & Transportation",
    pageCSS: ["travel&transportation"],
  });
});

router.post("/calculator/travel", isLoggedIn, (req, res) => {
  req.session.calc ||= {};
  req.session.calc.travel = req.body;
  return res.redirect("/calculator/home");
});

// ---------------------------
// STEP 2 → Home Energy
// ---------------------------
router.get("/calculator/home", isLoggedIn, (req, res) => {
  res.render("activities/co2calculator/calculatorHome", {
    title: "Home Energy",
    pageCSS: ["calculatorHome"],
  });
});

router.post("/calculator/home", isLoggedIn, (req, res) => {
  req.session.calc.home = req.body;
  return res.redirect("/calculator/fooddiet");
});

// ---------------------------
// STEP 3 → Food & Diet
// ---------------------------
router.get("/calculator/fooddiet", isLoggedIn, (req, res) => {
  res.render("activities/co2calculator/fooddiet", {
    title: "Food & Diet",
    pageCSS: ["food"],
  });
});

router.post("/calculator/fooddiet", isLoggedIn, (req, res) => {
  req.session.calc.fooddiet = req.body;
  return res.redirect("/calculator/wasterecycle");
});

// ---------------------------
// STEP 4 → Waste & Recycling
// ---------------------------
router.get("/calculator/wasterecycle", isLoggedIn, (req, res) => {
  res.render("activities/co2calculator/wasterecycleinput", {
    title: "Waste & Recycling",
    pageCSS: ["wasterecycleinput"],
  });
});

router.post("/calculator/wasterecycle", isLoggedIn, async (req, res) => {
  try {
    req.session.calc.waste = req.body;

    // 1️⃣ Calculate final footprint
    const result = calculateCarbon(req.session.calc);

    // Ensure breakdown numbers
    const numericBreakdown = {};
    for (let key in result.breakdown) {
      numericBreakdown[key] = Number(result.breakdown[key]) || 0;
    }

    const total = Number(result.total) || 0;

    // 2️⃣ Update user streak
    const streak = await updateUserStreak(req.user._id);

    // 3️⃣ Generate badges
    const badges = await generateBadges(req.user, Activity);

    // 4️⃣ Generate insights
    const insights = generateInsights({ total, breakdown: numericBreakdown });

    // 5️⃣ Save activity
    await Activity.create({
      user: req.user._id,
      type: "carbon",
      details: req.session.calc,
      co2: total,
    });

    // 6️⃣ Update user footprint score & lastCalculation
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { footprintScore: total },
      lastCalculation: {
        total,
        breakdown: numericBreakdown,
        createdAt: new Date(),
      },
    });

    // 7️⃣ Save for session result page
    req.session.calcResult = {
      total,
      breakdown: numericBreakdown,
      badges,
      insights,
      streak,
    };

    return res.redirect("/calculator/result");
  } catch (err) {
    console.error(err);
    return res.redirect("/calculator/start");
  }
});

// ---------------------------
// STEP 5 → Result Page (replaces dashboard)
// ---------------------------
router.get("/calculator/result", isLoggedIn, async (req, res) => {
  try {
    let total, breakdown, badges, insights, streak;

    // 1️⃣ Use session result if available
    if (req.session.calcResult) {
      ({ total, breakdown, badges, insights, streak } = req.session.calcResult);

    } else {
      // 2️⃣ Use user's last calculation if same day
      const user = await User.findById(req.user._id);
      if (user.lastCalculation) {
        const lastCalcDate = new Date(user.lastCalculation.createdAt);
        const today = new Date();

        if (
          lastCalcDate.getDate() === today.getDate() &&
          lastCalcDate.getMonth() === today.getMonth() &&
          lastCalcDate.getFullYear() === today.getFullYear()
        ) {
          // Recalculate using current logic to ensure updated values
          const lastCalcData = user.lastCalculation.details || user.lastCalculation;
          if (lastCalcData) {
            const recalculatedResult = calculateCarbon(lastCalcData);
            total = recalculatedResult.total;
            breakdown = recalculatedResult.breakdown;
          } else {
            total = user.lastCalculation.total;
            breakdown = user.lastCalculation.breakdown;
          }
          streak = user.streak;
          insights = generateInsights({ total, breakdown });
          badges = await generateBadges(user, Activity);
        }
      }
    }

    // 3️⃣ If no result, redirect to start
    if (!total || !breakdown) return res.redirect("/calculator/start");

    // 4️⃣ Render page
    res.render("activities/co2calculator/result", {
      total,
      breakdown,
      badges,
      insights,
      streak,
      globalAverage: GLOBAL_AVERAGE,
      pageCSS: ["result"],
    });

  } catch (err) {
    console.error(err);
    return res.redirect("/calculator/start");
  }
});


// ---------------------------
// Clear Session (for testing/debugging)
// ---------------------------
router.get("/calculator/clear", isLoggedIn, (req, res) => {
  delete req.session.calc;
  delete req.session.calcResult;
  req.flash("success", "Calculator session cleared. Please start a new calculation.");
  res.redirect("/calculator/start");
});

module.exports = router;
