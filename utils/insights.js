function generateInsights(breakdown) {
  const insights = [];

  // ---- TRAVEL ----
  if (breakdown.travel > 4) {
    insights.push({
      title: "Reduce Travel Emissions",
      description: "Try carpooling, using public transport, or reducing unnecessary car trips. Even one fewer weekly drive cuts emissions significantly.",
      icon: "🚗"
    });
  } else {
    insights.push({
      title: "Great Travel Habits!",
      description: "Your travel emissions are already low — keep it up by choosing efficient routes or using greener transport.",
      icon: "🌍"
    });
  }

  // ---- HOME ENERGY ----
  if (breakdown.home > 3) {
    insights.push({
      title: "Lower Home Energy Usage",
      description: "Consider switching to LED bulbs, reducing AC usage, or checking for energy leaks in your home.",
      icon: "⚡"
    });
  } else {
    insights.push({
      title: "Efficient Home Energy Use",
      description: "Your home energy footprint is good. Maintaining efficient appliances will help keep emissions low.",
      icon: "🏡"
    });
  }

  // ---- FOOD ----
  if (breakdown.food > 2.5) {
    insights.push({
      title: "Improve Food Footprint",
      description: "Try eating more local food or reducing meat consumption a bit — small steps make a big impact.",
      icon: "🥗"
    });
  } else {
    insights.push({
      title: "Sustainable Diet",
      description: "Great job! Your food choices already reduce environmental impact.",
      icon: "🌱"
    });
  }

  // ---- WASTE ----
  if (breakdown.waste > 1.5) {
    insights.push({
      title: "Better Waste Management",
      description: "Recycling and composting can significantly reduce waste emissions. Try separating waste at home.",
      icon: "♻️"
    });
  } else {
    insights.push({
      title: "Excellent Waste Habits",
      description: "You’re doing good with waste management. Keep composting and recycling!",
      icon: "🪴"
    });
  }

  return insights;
}

module.exports = { generateInsights };
