const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// GET /map
router.get("/", (req, res) => {
  res.render("map", {
    title: "Green Lane"
  });
});

// POST /map/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { from, to, mode, routes } = req.body;

    if (!from || !to || !mode || !Array.isArray(routes) || !routes.length) {
      return res.status(400).json({
        insight: "Missing required route data."
      });
    }

    const prompt = `
You are an eco-mobility assistant for a route planning app called Green Lane.

The user is traveling:
From: ${from}
To: ${to}
Mode selected: ${mode}

Available routes:
${routes.map((r, i) => `
Route ${i + 1} (${r.label})
- Distance: ${r.distanceKm} km
- Duration: ${r.durationMin} min
- Estimated CO2: ${r.co2g} g
- Eco Score: ${r.ecoScore}/100
`).join("\n")}

Task:
Give a short, practical recommendation in simple language.
Rules:
1. Mention which route is best and why.
2. Mention carbon impact difference if meaningful.
3. Mention trade-off between time and sustainability.
4. Keep it under 120 words.
5. Do not use markdown headings.
6. Make it user-friendly and direct.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const insight = response?.text?.trim() || "The eco-friendly route is recommended based on lower emissions and a strong overall score.";

    return res.json({ insight });
  } catch (error) {
    console.error("Gemini route analysis error:", error);

    return res.status(500).json({
      insight: "The most eco-friendly route is recommended because it balances low emissions with practical travel time."
    });
  }
});

module.exports = router;