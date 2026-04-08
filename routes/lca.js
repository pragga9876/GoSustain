require("dotenv").config();
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

// Optional Mongo model import
let LCAAnalysis = null;
try {
  LCAAnalysis = require("../models/LCA");
} catch (err) {
  console.log("LCA model not found. Continuing without DB save.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Simple in-memory cache
const lcaCache = new Map();

// -----------------------------
// Helpers
// -----------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(prompt, retries = 3) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      // SDK may expose text in different ways depending on version
      const text =
        response?.text ||
        response?.output_text ||
        response?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
        "";

      if (!text || !text.trim()) {
        throw new Error("Empty Gemini response");
      }

      return text;
    } catch (err) {
      lastError = err;
      console.log(`Gemini retry ${i + 1}/${retries} failed`);

      if (i < retries - 1) {
        await sleep((i + 1) * 1200);
      }
    }
  }

  throw lastError;
}

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clampPercent(value) {
  let num = Math.round(safeNumber(value, 0));
  if (num < 0) num = 0;
  if (num > 100) num = 100;
  return num;
}

function calculateImpact(co2) {
  if (co2 <= 1) return "LOW";
  if (co2 <= 4) return "MEDIUM";
  if (co2 <= 8) return "HIGH";
  return "VERY HIGH";
}

function calculateGrade(co2) {
  if (co2 <= 1) return "A+";
  if (co2 <= 2) return "A";
  if (co2 <= 4) return "B";
  if (co2 <= 7) return "C";
  if (co2 <= 10) return "D";
  return "F";
}

function generateComparison(co2) {
  const globalAvg = 5;

  if (co2 === globalAvg) return "This is close to the average product footprint.";
  if (co2 > globalAvg) {
    const diff = (((co2 - globalAvg) / globalAvg) * 100).toFixed(0);
    return `${diff}% higher than the average product footprint.`;
  }

  const diff = (((globalAvg - co2) / globalAvg) * 100).toFixed(0);
  return `${diff}% lower than the average product footprint.`;
}

function normalizePercentages(result) {
  let production = clampPercent(result.production);
  let transportation = clampPercent(result.transportation);
  let usage = clampPercent(result.usage);
  let disposal = clampPercent(result.disposal);

  let sum = production + transportation + usage + disposal;

  if (sum !== 100) {
    disposal = 100 - production - transportation - usage;

    if (disposal < 0) {
      disposal = 0;
      sum = production + transportation + usage;

      if (sum > 0) {
        production = Math.round((production / sum) * 100);
        transportation = Math.round((transportation / sum) * 100);
        usage = Math.round((usage / sum) * 100);
        disposal = 100 - production - transportation - usage;
      } else {
        production = 40;
        transportation = 20;
        usage = 25;
        disposal = 15;
      }
    }
  }

  result.production = production;
  result.transportation = transportation;
  result.usage = usage;
  result.disposal = disposal;

  return result;
}

function enrichResult(base) {
  const co2 = Number(safeNumber(base.co2, 1.5).toFixed(2));

  const result = {
    co2,
    impact: base.impact || calculateImpact(co2),
    production: base.production,
    transportation: base.transportation,
    usage: base.usage,
    disposal: base.disposal,
    tips: Array.isArray(base.tips) ? base.tips.slice(0, 3) : [],
    details: base.details || "Estimated product life cycle footprint based on typical consumer usage.",
    assumptions: Array.isArray(base.assumptions) ? base.assumptions.slice(0, 5) : [],
    image: base.image || "/images/defaultLCA.png"
  };

  normalizePercentages(result);

  while (result.tips.length < 3) {
    result.tips.push("Choose durable, reusable, and responsibly sourced alternatives where possible.");
  }

  if (result.assumptions.length === 0) {
    result.assumptions = [
      "Average consumer usage pattern",
      "Typical manufacturing process",
      "Standard transport and disposal conditions"
    ];
  }

  result.grade = calculateGrade(co2);
  result.comparison = generateComparison(co2);

  return result;
}

function tryParseGeminiJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid Gemini text response");
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();

  // direct parse
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // extract first JSON object block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const sliced = cleaned.slice(start, end + 1);
      return JSON.parse(sliced);
    }

    throw err;
  }
}

// -----------------------------
// Fallback mock data
// -----------------------------
function fallbackData(product) {
  const p = String(product || "").toLowerCase().trim();

  if (p.includes("shirt") || p.includes("t-shirt") || p.includes("tshirt")) {
    return enrichResult({
      co2: 2.1,
      impact: "MEDIUM",
      production: 65,
      transportation: 10,
      usage: 15,
      disposal: 10,
      tips: [
        "Buy organic or recycled fabric clothing.",
        "Wash in cold water and line-dry to reduce use-phase emissions.",
        "Donate, repair, or reuse instead of discarding."
      ],
      details: "A typical shirt has most of its emissions in raw material production, dyeing, and textile processing. Usage emissions depend mainly on washing and drying habits.",
      assumptions: [
        "Standard cotton-based shirt",
        "Average washing frequency",
        "Global textile supply chain"
      ],
      image: "/images/defaultLCA.png"
    });
  }

  if (p.includes("water bottle") || p.includes("bottle")) {
    return enrichResult({
      co2: 1.3,
      impact: "MEDIUM",
      production: 60,
      transportation: 10,
      usage: 5,
      disposal: 25,
      tips: [
        "Use the same bottle for as long as possible.",
        "Choose recycled-content or refillable options.",
        "Dispose through proper recycling streams."
      ],
      details: "Most of a bottle’s footprint usually comes from material extraction and manufacturing. Single-use patterns increase per-use impact significantly.",
      assumptions: [
        "Average consumer bottle",
        "Conventional plastic or metal manufacturing",
        "Standard end-of-life disposal"
      ],
      image: "/images/defaultLCA.png"
    });
  }

  if (p.includes("phone") || p.includes("smartphone") || p.includes("mobile")) {
    return enrichResult({
      co2: 55,
      impact: "VERY HIGH",
      production: 78,
      transportation: 8,
      usage: 10,
      disposal: 4,
      tips: [
        "Use the device longer before replacing it.",
        "Repair screens, batteries, and ports instead of buying new.",
        "Recycle through certified e-waste programs."
      ],
      details: "For smartphones, most emissions occur during extraction of metals, semiconductor manufacturing, and assembly. Extending the device lifetime reduces annualized footprint substantially.",
      assumptions: [
        "Average modern smartphone",
        "Typical charging pattern",
        "Global electronics supply chain"
      ],
      image: "/images/defaultLCA.png"
    });
  }

  if (p.includes("laptop")) {
    return enrichResult({
      co2: 120,
      impact: "VERY HIGH",
      production: 82,
      transportation: 6,
      usage: 9,
      disposal: 3,
      tips: [
        "Keep the laptop for more years before replacement.",
        "Buy repairable or refurbished models where possible.",
        "Use energy-saving modes and recycle responsibly."
      ],
      details: "Laptop emissions are dominated by semiconductor fabrication, metals, display production, and assembly. Use-phase emissions are lower compared with manufacturing for most users.",
      assumptions: [
        "Average consumer laptop",
        "Moderate electricity use",
        "Conventional global manufacturing and shipping"
      ],
      image: "/images/defaultLCA.png"
    });
  }

  if (p.includes("jeans")) {
    return enrichResult({
      co2: 3.5,
      impact: "MEDIUM",
      production: 55,
      transportation: 10,
      usage: 25,
      disposal: 10,
      tips: [
        "Wash less often and use cold water.",
        "Choose recycled or responsibly sourced denim.",
        "Repair and extend wear life."
      ],
      details: "Jeans usually carry significant emissions from cotton cultivation, dyeing, and textile finishing. Frequent hot washes and machine drying further increase the footprint.",
      assumptions: [
        "Standard cotton denim jeans",
        "Average consumer washing pattern",
        "Retail supply chain"
      ],
      image: "/images/defaultLCA.png"
    });
  }

  return enrichResult({
    co2: 1.5,
    impact: "MEDIUM",
    production: 50,
    transportation: 20,
    usage: 20,
    disposal: 10,
    tips: [
      "Choose durable and reusable alternatives.",
      "Prefer locally made products when possible.",
      "Recycle or dispose of the item responsibly."
    ],
    details: "This is an estimated product footprint based on common life cycle stages such as manufacturing, shipping, use, and disposal.",
    assumptions: [
      "Average consumer product",
      "Typical manufacturing process",
      "Standard transport and disposal pattern"
    ],
    image: "/images/defaultLCA.png"
  });
}

// -----------------------------
// Routes
// -----------------------------
router.post("/analyze", async (req, res) => {
  try {
    const { product } = req.body || {};
    const cleanProduct = String(product || "").trim();

    if (!cleanProduct) {
      return res.status(400).json({
        success: false,
        message: "Product name is required."
      });
    }

    const cacheKey = cleanProduct.toLowerCase();
    if (lcaCache.has(cacheKey)) {
      return res.json({
        success: true,
        result: lcaCache.get(cacheKey),
        source: "cache"
      });
    }

    const prompt = `
You are an environmental life cycle analysis assistant.

Analyze the life cycle carbon impact of this product: "${cleanProduct}".

Return ONLY valid JSON. Do not add markdown. Do not add explanation outside JSON.

Use this exact structure:
{
  "co2": number,
  "impact": "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH",
  "production": number,
  "transportation": number,
  "usage": number,
  "disposal": number,
  "tips": ["tip1", "tip2", "tip3"],
  "details": "2-4 sentence realistic explanation.",
  "assumptions": ["assumption1", "assumption2", "assumption3"],
  "image": "/images/defaultLCA.png"
}

Rules:
- production + transportation + usage + disposal must total 100
- co2 must be a realistic approximate footprint per product unit in kg CO2e
- tips must be practical
- assumptions must be realistic
- be conservative and realistic, not exaggerated
`;

    let finalResult;

    try {
      const text = await generateWithRetry(prompt, 3);
      const parsed = tryParseGeminiJSON(text);
      finalResult = enrichResult(parsed);
    } catch (geminiError) {
      console.error("Gemini LCA failed, using fallback:", geminiError?.message || geminiError);
      finalResult = fallbackData(cleanProduct);
    }

    lcaCache.set(cacheKey, finalResult);

    if (LCAAnalysis) {
      try {
        await LCAAnalysis.create({
          product: cleanProduct,
          co2: finalResult.co2,
          impact: finalResult.impact,
          production: finalResult.production,
          transportation: finalResult.transportation,
          usage: finalResult.usage,
          disposal: finalResult.disposal,
          tips: finalResult.tips,
          details: finalResult.details,
          assumptions: finalResult.assumptions,
          image: finalResult.image,
          grade: finalResult.grade,
          comparison: finalResult.comparison
        });
      } catch (dbErr) {
        console.log("LCA save skipped:", dbErr.message);
      }
    }

    return res.json({
      success: true,
      result: finalResult,
      source: finalResult === fallbackData(cleanProduct) ? "fallback" : "ai"
    });
  } catch (error) {
    console.error("Final fallback triggered:", error);

    return res.json({
        success: true,
        result: finalResult,
        source: resultSource
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    if (!LCAAnalysis) {
      return res.json({
        success: true,
        history: []
      });
    }

    const history = await LCAAnalysis.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error("LCA history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history"
    });
  }
});

module.exports = router;