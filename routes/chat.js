const express = require("express");
const router = express.Router();
const fetch = require("node-fetch"); // npm install node-fetch

// local dataset of eco advice
const ecoData = {
  travel: [
    "🚴 Try cycling or walking for short distances — zero emissions!",
    "🚗 Carpool or use public transport to cut your CO₂ by 70%.",
    "✈️ Flying less frequently reduces your footprint dramatically."
  ],
  energy: [
    "💡 Switch to LED bulbs — they use 75% less energy.",
    "🔌 Unplug chargers when not in use to save electricity.",
    "🌞 Try using natural daylight — it’s free and eco-friendly!"
  ],
  diet: [
    "🥗 Include more plant-based meals in your diet.",
    "🍗 Reduce red meat consumption — it has a high CO₂ cost.",
    "🍎 Buy local and seasonal produce to lower transport emissions."
  ],
  general: [
    "🌱 Every small action counts — consistency matters!",
    "♻️ Reduce, Reuse, Recycle — your daily mantra.",
    "🚰 Save water — turn off taps while brushing your teeth."
  ]
};

// simple NLP-like keyword search
function findTopic(message) {
  const msg = message.toLowerCase();
  if (msg.includes("travel") || msg.includes("car") || msg.includes("bus") || msg.includes("bike"))
    return "travel";
  if (msg.includes("energy") || msg.includes("electric") || msg.includes("light"))
    return "energy";
  if (msg.includes("food") || msg.includes("diet") || msg.includes("meat") || msg.includes("veg"))
    return "diet";
  return "general";
}

// optional: fetch a random sustainability fact from an open API
async function getExternalFact() {
  try {
    const res = await fetch("https://api.api-ninjas.com/v1/facts?limit=1", {
      headers: { 'X-Api-Key': 'YOUR_FREE_API_NINJAS_KEY' } // optional
    });
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.fact) return data[0].fact;
  } catch (err) {
    return null;
  }
  return null;
}

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  const topic = findTopic(message);
  const tips = ecoData[topic];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  // optional: include live environmental fact
  const fact = await getExternalFact();
  const reply = fact ? `${randomTip}\n\n💬 Fun Fact: ${fact}` : randomTip;

  res.json({ reply });
});

module.exports = router;
