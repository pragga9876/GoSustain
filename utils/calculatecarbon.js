module.exports = function calculateCarbon(data) {

  // ==========================
  // 1. TRAVEL
  // ==========================
  const t = data.travel || {};

  const travel =
    (parseFloat(t.carKm) || 0) * 0.21 +         // car emissions per km
    (parseFloat(t.bikeKm) || 0) * 0.0 +         // bike = 0 emissions
    (parseFloat(t.busKm) || 0) * 0.05 +         // bus per km
    (parseFloat(t.trainKm) || 0) * 0.04 +       // train per km
    (parseFloat(t.flightHours) || 0) * 10;      // flight emissions (reduced from 25 to 10 kg/hour for weekly calculation)


  // ==========================
  // 2. HOME ENERGY
  // ==========================
  const h = data.home || {};

  const home =
    (parseFloat(h.electricityKwh) || 0) * 0.1 +    // weekly electricity emissions (reduced from 0.82)
    (parseFloat(h.lpgCylinders) || 0) * 2.5 +      // weekly LPG factor (reduced from 12.7)
    (parseFloat(h.waterUsage) || 0) * 0.0001;      // weekly water usage factor


  // ==========================
  // 3. FOOD & DIET
  // ==========================
  const f = data.fooddiet || {};

  const dietFactors = {
    omnivore: 2.5,     // lower & realistic
    vegetarian: 1.7,
    vegan: 1.5,
  };

  // Meat impact (monthly realistic values)
  const meatScore =
    f.meatConsumption === "daily" ? 15 :
    f.meatConsumption === "weekly" ? 5 :
    1;

  const food =
    (dietFactors[f.dietType] || 2.3) * 7 +     // weekly food emissions (reduced from 20)
    meatScore -
    ((parseFloat(f.localFoodPercentage) || 0) * 0.05); // weekly local food reduction


  // ==========================
  // 4. WASTE
  // ==========================
  const w = data.waste || {};

  const waste =
    (parseFloat(w.weeklyWasteKg) || 0) * 0.5 +    // weekly waste emissions (reduced from 2)
    (w.recycle ? -2 : 0) +                        // weekly recycling benefit (reduced from -5)
    (w.compost ? -3 : 0);                         // weekly composting benefit (reduced from -7)


  // ==========================
  // 5. TOTAL
  // ==========================
  const total = travel + home + food + waste;

  return {
    total: Number(total.toFixed(2)),
    breakdown: {
      travel: Number(travel.toFixed(2)),
      home: Number(home.toFixed(2)),
      food: Number(food.toFixed(2)),
      waste: Number(waste.toFixed(2)),
    }
  };
};
