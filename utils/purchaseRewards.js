function getPurchaseRewardData(purchase = {}) {
  const carbon = Number(purchase.estimatedCarbonKg || 0);
  const category = (purchase.category || "").toLowerCase();
  const title = (purchase.title || "").toLowerCase();

  let points = 5; // base participation points
  let badgeHint = null;

  // Lower-carbon products get more reward points
  if (carbon <= 2) {
    points += 15;
  } else if (carbon <= 5) {
    points += 10;
  } else if (carbon <= 10) {
    points += 6;
  } else {
    points += 2;
  }

  // Extra points for certain eco-friendly types
  if (
    title.includes("steel") ||
    title.includes("reusable") ||
    title.includes("glass") ||
    title.includes("cloth bag") ||
    category.includes("stationery")
  ) {
    points += 5;
  }

  // Small badge hint for future use
  if (carbon <= 2) {
    badgeHint = {
      id: "low_carbon_purchase",
      name: "Low Carbon Choice",
      description: "Added a low-carbon purchase to your profile."
    };
  }

  return {
    points,
    badgeHint
  };
}

module.exports = getPurchaseRewardData;