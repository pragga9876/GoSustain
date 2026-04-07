// utils/redeemRecommender.js
// Suggests a redeem action based on user activity stats

function recommendRedeem(user) {
  if (!user || !user.activityStats) {
    return "Plant a Tree 🌳 — always a good start!";
  }

  const { travelScore = 0, dietScore = 0, energyScore = 0 } = user.activityStats;

  if (travelScore > energyScore && travelScore > dietScore)
    return "Offset Travel Carbon — fund a clean transport project 🚗";
  if (energyScore > travelScore && energyScore > dietScore)
    return "Adopt Solar Energy ☀️ — redeem for home solar credits!";
  if (dietScore > travelScore)
    return "Support Sustainable Food 🌾 — redeem for green farms!";

  return "Plant a Tree 🌳 — always a good start!";
}

module.exports = { recommendRedeem };
