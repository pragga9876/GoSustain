module.exports = function calculateCarbon(data) {
  // ==========================
  // 1. TRAVEL
  // ==========================
  const t = data.travel || {};

  const vehicleFactors = {
    petrol: 0.192,
    diesel: 0.171,
    hybrid: 0.110,
    electric: 0.060
  };

  const carFactor = vehicleFactors[t.vehicleType] || 0.150;

  const travel =
    (parseFloat(t.carKm) || 0) * carFactor +
    (parseFloat(t.bikeKm) || 0) * 0.072 +
    (parseFloat(t.busKm) || 0) * 0.105 +
    (parseFloat(t.trainKm) || 0) * 0.041 +
    ((parseFloat(t.flightKm) || 0) / 52) * 0.146;

  // ==========================
  // 2. HOME ENERGY
  // ==========================
  const h = data.home || {};

  const sourceFactor = {
    renewable: 0.20,
    mixed: 0.45,
    nonrenewable: 0.70
  };

  const heatingFactor = {
    electric: 0.8,
    gas: 2.5,
    wood: 1.2
  };

  const electricityMonthly =
    (parseFloat(h.electricityKwh) || 0) *
    (sourceFactor[h.energySource] || 0.45);

  const lpgMonthly = (parseFloat(h.lpgCylinders) || 0) * 29.0;
  const waterMonthly = (parseFloat(h.waterUsage) || 0) * 0.0003;
  const heatingMonthly =
    (parseFloat(h.householdSize) || 1) *
    (heatingFactor[h.heatingFuel] || 0);

  const home =
    (electricityMonthly + lpgMonthly + waterMonthly + heatingMonthly) / 4.345;

  // ==========================
  // 3. FOOD & DIET
  // ==========================
  const f = data.food || data.fooddiet || {};

  let base = 0;

  switch (f.dietType) {
    case "vegan":
      base = 15;
      break;
    case "vegetarian":
      base = 22;
      break;
    case "pescatarian":
      base = 28;
      break;
    case "omnivore":
      base = 38;
      break;
    default:
      base = 0;
  }

  const meatFrequency = f.meatFrequency || f.meatConsumption || "never";

  let meatAdj = 0;
  if (f.dietType === "omnivore" || f.dietType === "pescatarian") {
    switch (meatFrequency) {
      case "daily":
        meatAdj = 10;
        break;
      case "weekly":
        meatAdj = 5;
        break;
      case "occasionally":
        meatAdj = 2;
        break;
      case "never":
        meatAdj = 0;
        break;
      default:
        meatAdj = 0;
    }
  }

  const localAdj =
    ((100 - (parseFloat(f.localFoodPercentage) || 0)) / 100) * 6;

  let wasteAdj = 0;
  switch (f.foodWaste) {
    case "low":
      wasteAdj = 1;
      break;
    case "moderate":
      wasteAdj = 4;
      break;
    case "high":
      wasteAdj = 8;
      break;
    default:
      wasteAdj = 0;
  }

  const food = base + meatAdj + localAdj + wasteAdj;

  // ==========================
  // 4. WASTE
  // ==========================
  const w = data.waste || {};

  let waste = (parseFloat(w.weeklyWasteKg) || 0) * 0.55;

  if (w.recycle === true || w.recycle === "true") {
    waste *= 0.82;
  }

  if (w.compost === true || w.compost === "true") {
    waste *= 0.88;
  }

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
      waste: Number(waste.toFixed(2))
    }
  };
};
