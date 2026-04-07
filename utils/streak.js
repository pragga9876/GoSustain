// utils/streak.js
const User = require("../models/user");

async function updateUserStreak(userId, activityDate = new Date()) {
  const user = await User.findById(userId);
  if (!user) return null;

  if (!user.streak) user.streak = { current: 0, lastActivityAt: null };

  const msPerDay = 24 * 60 * 60 * 1000;
  const toDateOnly = d => {
    const dt = new Date(d);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  };

  const last = user.streak.lastActivityAt ? toDateOnly(user.streak.lastActivityAt) : null;
  const today = toDateOnly(activityDate);

  if (!last) {
    user.streak.current = 1;
    user.streak.lastActivityAt = today;
  } else {
    const diffDays = Math.round((today - last) / msPerDay);
    if (diffDays === 0) {
      // do nothing
    } else if (diffDays === 1) {
      user.streak.current = (user.streak.current || 0) + 1;
      user.streak.lastActivityAt = today;
    } else {
      user.streak.current = 1;
      user.streak.lastActivityAt = today;
    }
  }

  await user.save({ validateBeforeSave: false });
  return user.streak;
}

module.exports = { updateUserStreak };
