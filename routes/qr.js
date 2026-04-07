// routes/qr.js
const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const Activity = require("../models/activity");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { generateBadges } = require("../utils/badges");

// Simple CO2 calculation based on activity type
function calculateCO2(type) {
  switch (type) {
    case "travel": return 2;   // example: 2 kg CO2 saved
    case "energy": return 1;   // example: 1 kg CO2 saved
    case "waste": return 0.5;  // example: 0.5 kg CO2 saved
    default: return 0;
  }
}
// GET route to show the QR scan page
router.get("/scan-activity", isLoggedIn, (req, res) => {
  res.render("qr/scan", {
    title: "Scan QR Code",
    pageCSS: ["qr"],
    currentUser: req.user
  });
});


// Route to generate QR code for an activity
router.get("/generate-qr/:activityType", isLoggedIn, async (req, res) => {
  const { activityType } = req.params;
  try {
    const qrData = JSON.stringify({ userId: req.user._id, activityType });
    const qrCode = await QRCode.toDataURL(qrData);

    res.render("qr/generate", {
      title: `QR Code for ${activityType}`,
      pageCSS: ["qr"],
      qrCode,
      activityType
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to generate QR code");
    res.redirect("/activities");
  }
});

// Route to scan QR and log activity
router.post("/scan-activity", isLoggedIn, async (req, res) => {
  try {
    const { qrData } = req.body; // QR scanner should send decoded data
    if (!qrData) return res.json({ success: false, error: "No QR data received" });

    const parsed = JSON.parse(qrData);
    if (parsed.userId !== req.user._id.toString()) {
      return res.json({ success: false, error: "QR code does not belong to you" });
    }

    // Create activity
    const co2 = calculateCO2(parsed.activityType);
    const activity = await Activity.create({
      user: req.user._id,
      type: parsed.activityType,
      date: new Date(),
      co2
    });

    // Update user streaks and badges
    const user = await User.findById(req.user._id);
    const streak = user.streak || { current: 0 };
    const newBadges = await generateBadges(user, Activity, streak);
    if (newBadges.length > 0) user.badges.push(...newBadges);
    user.badgesEarned = user.badges.length;

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `${parsed.activityType} logged successfully!`,
      activity,
      badges: newBadges,
      points: user.points || 0
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Failed to log activity" });
  }
});

module.exports = router;
