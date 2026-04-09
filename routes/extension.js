const express = require("express");
const router = express.Router();

const Purchase = require("../models/Purchase");
const estimateCarbon = require("../utils/estimateCarbon");
const getGreenerAlternative = require("../utils/getGreenerAlternative");
const updateUserPurchaseStats = require("../utils/updateUserPurchaseStats");
const isDuplicatePurchase = require("../utils/isDuplicatePurchase");

// Auth guard for logged-in website users
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Unauthorized. Please log in first."
  });
}

/*
  POST /api/extension/purchases
  Expected body:
  {
    purchases: [
      {
        platform: "Amazon",
        title: "Milton Water Bottle",
        category: "Household",
        price: 399,
        quantity: 1,
        orderDate: "2026-04-09"
      }
    ]
  }
*/
router.post("/purchases", isLoggedIn, async (req, res) => {
  try {
    const { purchases } = req.body;

    if (!Array.isArray(purchases) || purchases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No purchases provided."
      });
    }

    const savedPurchases = [];
    const skippedPurchases = [];

    for (const item of purchases) {
      const cleanItem = {
        platform: item.platform || "Manual",
        title: (item.title || "").trim(),
        category: (item.category || "General").trim(),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        orderDate: item.orderDate ? new Date(item.orderDate) : new Date()
      };

      if (!cleanItem.title || cleanItem.price <= 0) {
        skippedPurchases.push({
          item,
          reason: "Invalid title or price"
        });
        continue;
      }

      const duplicate = await isDuplicatePurchase(req.user._id, cleanItem);
      if (duplicate) {
        skippedPurchases.push({
          item: cleanItem,
          reason: "Duplicate purchase"
        });
        continue;
      }

      const estimatedCarbonKg = estimateCarbon(cleanItem);
      const greenerAlternative = getGreenerAlternative(cleanItem);

      const createdPurchase = await Purchase.create({
        user: req.user._id,
        platform: cleanItem.platform,
        title: cleanItem.title,
        category: cleanItem.category,
        price: cleanItem.price,
        quantity: cleanItem.quantity,
        orderDate: cleanItem.orderDate,
        estimatedCarbonKg,
        greenerAlternative,
        rawData: {
          source: "browser-extension",
          originalPayload: item
        }
      });

      await updateUserPurchaseStats(req.user._id, createdPurchase);

      savedPurchases.push(createdPurchase);
    }

    return res.status(201).json({
      success: true,
      message: "Extension purchases processed successfully.",
      savedCount: savedPurchases.length,
      skippedCount: skippedPurchases.length,
      savedPurchases,
      skippedPurchases
    });
  } catch (err) {
    console.error("Extension purchase save error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process extension purchases."
    });
  }
});

module.exports = router;