const express = require("express");
const router = express.Router();
const axios = require("axios");
const FavouriteLocation = require("../models/FavoriteLocation");
const { isLoggedIn } = require("../middleware/auth");
const dotenv = require("dotenv");
dotenv.config();

const OPEN_WEATHER_API_KEY =process.env.OPEN_WEATHER_API_KEY ;

// ---------------- MOCK FALLBACK DATA ----------------
const MOCK = {
  "india": {
    label: "India",
    pm25: 58.2,
    pm10: 18,
    no2: 10,
    so2: 6,
    o3: 10,
    co: 4,
    breakdown: { pm25: 52, pm10: 18, no2: 10, so2: 6, o3: 10, co: 4 },
    updatedAt: "2025-07-14T08:42:00Z"
  },
  "kolkata": {
    label: "Kolkata, IN",
    pm25: 96.5,
    pm10: 16,
    no2: 6,
    so2: 4,
    o3: 6,
    co: 4,
    breakdown: { pm25: 64, pm10: 16, no2: 6, so2: 4, o3: 6, co: 4 },
    updatedAt: "2025-07-14T06:10:00Z"
  },
  "tripura": {
    label: "Tripura, IN",
    pm25: 38.4,
    pm10: 20,
    no2: 8,
    so2: 6,
    o3: 14,
    co: 6,
    breakdown: { pm25: 46, pm10: 20, no2: 8, so2: 6, o3: 14, co: 6 },
    updatedAt: "2025-07-13T23:18:00Z"
  },
  "mumbai": {
    label: "Mumbai, IN",
    pm25: 42.0,
    pm10: 22,
    no2: 10,
    so2: 4,
    o3: 10,
    co: 6,
    breakdown: { pm25: 48, pm10: 22, no2: 10, so2: 4, o3: 10, co: 6 },
    updatedAt: "2025-07-14T05:55:00Z"
  },
  "new york": {
    label: "New York, US",
    pm25: 14.8,
    pm10: 10,
    no2: 18,
    so2: 6,
    o3: 32,
    co: 6,
    breakdown: { pm25: 28, pm10: 10, no2: 18, so2: 6, o3: 32, co: 6 },
    updatedAt: "2025-07-14T09:02:00Z"
  }
};

// ---------------- RENDER AIREFY PAGE ----------------
router.get("/", (req, res) => {
  res.render("airefy/index");
});

// ---------------- AQI API ROUTE ----------------
router.get("/api/aqi", async (req, res) => {
  let q = (req.query.q || "").trim().toLowerCase();
  if (!q) {
    return res.json({ success: false, error: "Please enter a location" });
  }

  try {
    // STEP 1 — GET GEO DATA
    const geoURL = "http://api.openweathermap.org/geo/1.0/direct";
    const geoRes = await axios.get(geoURL, {
      params: { q, limit: 1, appid: OPEN_WEATHER_API_KEY },
    });

    if (!geoRes.data || !geoRes.data.length) {
      throw new Error("No location found");
    }

    const { lat, lon, name, country } = geoRes.data[0];

    // STEP 2 — GET AIR QUALITY
    const airURL = "http://api.openweathermap.org/data/2.5/air_pollution";
    const airRes = await axios.get(airURL, {
      params: { lat, lon, appid: OPEN_WEATHER_API_KEY },
    });

    if (!airRes.data || !airRes.data.list.length) {
      throw new Error("No AQI data returned");
    }

    const c = airRes.data.list[0].components;

    // SEND CLEAN RESPONSE
    return res.json({
      success: true,
      data: {
        label: `${name}, ${country}`,
        pm25: c.pm2_5,
        pm10: c.pm10,
        no2: c.no2,
        so2: c.so2,
        o3: c.o3,
        co: c.co,

        breakdown: {
          pm25: c.pm2_5,
          pm10: c.pm10,
          no2: c.no2,
          so2: c.so2,
          o3: c.o3,
          co: c.co,
        },

        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("AQI API ERROR:", err.message);

    // Step 3: Fallback mock data
    if (MOCK[q]) {
      console.log("Using mock data for:", q);
      return res.json({ success: true, data: MOCK[q] });
    }

    // Step 4: Total failure
    return res.json({
      success: false,
      error: "Location not found or API error",
    });
  }
});

// ---------------- COMPARATOR OPTIONS ----------------
router.get("/api/compare-options", isLoggedIn, async (req, res) => {
  try {
    const favs = await FavouriteLocation.find({ user: req.user._id });

    const options = [
      { id: "baseline", label: "Very Good (PM2.5 12)" },
    ];

    favs.forEach((loc) =>
      options.push({ id: loc.name.toLowerCase(), label: loc.name })
    );

    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json([{ id: "baseline", label: "Very Good (PM2.5 12)" }]);
  }
});

module.exports = router;
