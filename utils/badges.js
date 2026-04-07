// utils/badges.js — fully updated for EcoTrack

// ============================================================
// 1. BADGE DEFINITIONS
// ============================================================
const BADGE_DEFS = [
  {
    id: "green_beginner",
    name: "🪴 Green Beginner",
    description: "Log 5 activities to earn this badge.",
    type: "count",
    key: "totalActivities",
    threshold: 5,
    icon: "🪴",
  },
  {
    id: "eco_explorer",
    name: "🚴 Eco Explorer",
    description: "Reduce travel emissions by 20% compared to your first week.",
    type: "relative_reduction",
    key: "travel",
    thresholdPercent: 20,
    icon: "🚴",
  },
  {
    id: "energy_saver",
    name: "⚡ Energy Saver",
    description: "Have 3 energy entries under 1 kWh.",
    type: "energy_low_entries",
    key: "energy",
    thresholdCount: 3,
    icon: "⚡",
  },
  // -----------------------------
  // Streak badges
  // -----------------------------
  {
    id: "streak_3",
    name: "🔥 3-Day Streak",
    description: "Complete 3 consecutive days of activities.",
    type: "streak",
    threshold: 3,
    icon: "🔥",
  },
  {
    id: "streak_7",
    name: "🌍 7-Day Streak",
    description: "A full week of consistent eco-activities!",
    type: "streak",
    threshold: 7,
    icon: "🌍",
  },
  {
    id: "streak_30",
    name: "💚 30-Day Streak",
    description: "One month of consistent eco-efforts!",
    type: "streak",
    threshold: 30,
    icon: "💚",
  },
];

// ============================================================
// 2. HELPER: Check if user already has badge
// ============================================================
function hasBadge(user, badgeId) {
  if (!user || !Array.isArray(user.badges)) return false;
  return user.badges.some(b => b.id === badgeId);
}

// ============================================================
// 3. MAIN BADGE EVALUATION
// ============================================================
async function evaluateBadges(user, ActivityModel, streak = { current: 0 }) {
  const newlyEarned = [];
  if (!user || !user._id || !ActivityModel) return newlyEarned;

  // Fetch all activities of the user
  const activities = await ActivityModel.find({ user: user._id }).catch(() => []);

  const agg = {
    totalActivities: activities.length || 0,
    travelEmitted: activities
      .filter(a => a.type === "travel")
      .reduce((sum, a) => sum + (a.co2 || 0), 0),
    energyEntries: activities.filter(a => a.type === "energy"),
    firstWeekTravel: 0,
  };

  const joined = user.createdAt || new Date();
  const oneWeekAfterJoin = new Date(joined);
  oneWeekAfterJoin.setDate(oneWeekAfterJoin.getDate() + 7);

  agg.firstWeekTravel = activities
    .filter(a => a.type === "travel" && a.date && a.date <= oneWeekAfterJoin)
    .reduce((sum, a) => sum + (a.co2 || 0), 0);

  for (const def of BADGE_DEFS) {
    if (hasBadge(user, def.id)) continue;

    let earned = false;

    switch (def.type) {
      case "count":
        if ((agg[def.key] || 0) >= def.threshold) earned = true;
        break;

      case "relative_reduction":
        if (agg.firstWeekTravel > 0) {
          const reductionPercent = ((agg.firstWeekTravel - agg.travelEmitted) / agg.firstWeekTravel) * 100;
          if (reductionPercent >= def.thresholdPercent) earned = true;
        }
        break;

      case "energy_low_entries":
        const lowCount = (agg.energyEntries || []).filter(e => (e.kwh || 0) < 1).length;
        if (lowCount >= def.thresholdCount) earned = true;
        break;

      case "streak":
        if ((streak.current || 0) >= def.threshold) earned = true;
        break;
    }

    if (earned) {
      newlyEarned.push({
        id: def.id,
        name: def.name,
        description: def.description,
        earnedAt: new Date(),
        icon: def.icon || "🏆",
        earned: true,
      });
    }
  }

  return newlyEarned;
}

// ============================================================
// 4. Wrapper for compatibility
// ============================================================
async function generateBadges(user, ActivityModel, streak = { current: 0 }) {
  const badges = await evaluateBadges(user, ActivityModel, streak);
  return badges;
}

module.exports = {
  BADGE_DEFS,
  hasBadge,
  evaluateBadges,
  generateBadges,
};
