const Purchase = require("../models/Purchase");

async function isDuplicatePurchase(userId, item = {}) {
  const title = (item.title || "").trim();
  const platform = (item.platform || "Manual").trim();
  const price = Number(item.price || 0);
  const quantity = Number(item.quantity || 1);

  if (!title) return false;

  const existing = await Purchase.findOne({
    user: userId,
    platform,
    title,
    price,
    quantity
  });

  return !!existing;
}

module.exports = isDuplicatePurchase;