const express = require("express");
const router = express.Router();

const Purchase = require("../models/Purchase");
const estimateCarbon = require("../utils/estimateCarbon");
const getGreenerAlternative = require("../utils/getGreenerAlternative");
const updateUserPurchaseStats = require("../utils/updateUserPurchaseStats");

// Simple auth guard
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

// Show all purchases of logged-in user
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id }).sort({ createdAt: -1 });

    const totalSpent = purchases.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCarbon = purchases.reduce((sum, item) => sum + item.estimatedCarbonKg, 0);

    res.render("purchases/index", {
      purchases,
      totalSpent,
      totalCarbon
    });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).send("Failed to load purchases");
  }
});

// Show add purchase form
router.get("/new", isLoggedIn, (req, res) => {
  res.render("purchases/new");
});

// Save manual purchase
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const {
      platform,
      title,
      category,
      price,
      quantity,
      orderDate
    } = req.body;

    const productData = {
      platform: platform || "Manual",
      title,
      category,
      price: Number(price),
      quantity: Number(quantity) || 1,
      orderDate: orderDate || new Date()
    };

    const estimatedCarbonKg = estimateCarbon(productData);
    const greenerAlternative = getGreenerAlternative(productData);

    const createdPurchase = await Purchase.create({
      user: req.user._id,
      platform: productData.platform,
      title: productData.title,
      category: productData.category || "General",
      price: productData.price,
      quantity: productData.quantity,
      orderDate: productData.orderDate,
      estimatedCarbonKg,
      greenerAlternative,
      rawData: {
        source: "manual-form"
      }
    });

    await updateUserPurchaseStats(req.user._id, createdPurchase);

    res.redirect("/purchases");
  } catch (err) {
    console.error("Error saving purchase:", err);
    res.status(500).send("Failed to save purchase");
  }
});

// Optional delete route
router.post("/:id/delete", isLoggedIn, async (req, res) => {
  try {
    await Purchase.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    res.redirect("/purchases");
  } catch (err) {
    console.error("Error deleting purchase:", err);
    res.status(500).send("Failed to delete purchase");
  }
});

module.exports = router;