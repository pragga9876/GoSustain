// routes/market.js
const express = require("express");
const router = express.Router();
const MarketItem = require("../models/marketItem");
const Redemption = require("../models/redemption");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { generateBadges } = require("../utils/badges");
const pdfkit = require("pdfkit");
const fs = require("fs");

// ---------------------------
// Market front page: list items
// ---------------------------
router.get("/market", isLoggedIn, async (req, res) => {
  try {
    const items = await MarketItem.find().sort({ costPoints: 1 });
    res.render("market/index", {
      title: "Marketplace | EcoTrack",
      pageCSS: ["market"],
      currentUser: req.user,
      items
    });
  } catch (err) {
    console.error("Market load error:", err);
    req.flash("error", "Failed to load marketplace");
    res.redirect("/");
  }
});

// ---------------------------
// Redeem an item
router.post("/market/:id/redeem", isLoggedIn, async (req, res) => {
  try {
    const item = await MarketItem.findById(req.params.id);
    if (!item) return res.json({ success: false, error: "Item not found" });

    const user = await User.findById(req.user._id);
    if (!user) return res.json({ success: false, error: "User not found" });
    if ((user.points || 0) < item.costPoints)
      return res.json({ success: false, error: "Not enough points" });

    // Deduct points
    user.points -= item.costPoints;

    // Log redeem transaction
    const redeemTx = {
      type: "redeem",
      name: item.title,
      points: item.costPoints,
      date: new Date()
    };
    user.transactions.push(redeemTx);

    // Generate badges
    const streak = user.streak || { current: 0 };
    const newBadges = await generateBadges(user, null, streak);
    if (newBadges.length > 0) user.badges.push(...newBadges);
    user.badgesEarned = user.badges.length;

    await user.save({ validateBeforeSave: false });

    // Log redemption
    await Redemption.create({
      user: user._id,
      item: item._id,
      pointsSpent: item.costPoints,
      message: req.body.message || ""
    });

    // Build certificate URL
    const certificateUrl = `/certificate/${item._id}`;

    // Return updated data for frontend AJAX
    res.json({
      success: true,
      points: user.points,
      badges: user.badges,
      earned: user.transactions.filter(t => t.type === 'earn').reduce((s,t)=>s+t.points,0),
      redeemed: user.transactions.filter(t => t.type === 'redeem').reduce((s,t)=>s+t.points,0),
      certificateUrl
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Failed to redeem item" });
  }
});





// ---------------------------
// Redeem statistics
// ---------------------------
router.get("/redeem-stats", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tx = user.transactions || [];

    const earned = tx.filter(t => t.type === "earn").reduce((s, t) => s + t.points, 0);
    const redeemed = tx.filter(t => t.type === "redeem").reduce((s, t) => s + Math.abs(t.points), 0);

    res.render("market/stats", {
      title: "Redeem Analytics | EcoTrack",
      pageCSS: ["marketStats"],
      currentUser: req.user,
      earned,
      redeemed,
      tx
    });
  } catch (err) {
    console.error("Redeem stats error:", err);
    req.flash("error", "Failed to load redeem stats");
    res.redirect("/market");
  }
});

// ---------------------------
// Generate certificate
// ---------------------------
router.get("/certificate/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;

    const doc = new pdfkit();
    const fileName = `certificate-${id}-${Date.now()}.pdf`;
    const filePath = `./public/certificates/${fileName}`;
    fs.mkdirSync("./public/certificates", { recursive: true });

    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(24).text("🌿 Equil Carbon Offset Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`This certifies that ${user.username} has successfully redeemed:`);
    doc.text(`${id} — reducing carbon impact and supporting sustainability.`);
    doc.moveDown();
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text("Keep up your eco-friendly actions!");
    doc.end();

    req.flash("success", "✅ Certificate generated successfully!");
    res.redirect(`/certificates/${fileName}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to generate certificate");
    res.redirect("/market");
  }
});

module.exports = router;
