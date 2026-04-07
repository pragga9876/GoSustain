// backend/utils/receiptUtils.js
const axios = require("axios");

// small local carbon DB (fallback)
const LOCAL_CARBON_DB = {
  tomato:0.15, lettuce:0.10, carrot:0.08, broccoli:0.25, spinach:0.15,
  potato:0.10, onion:0.12, cucumber:0.08, peppers:0.20, cabbage:0.10,
  apple:0.15, banana:0.20, orange:0.18, strawberry:0.35, grape:0.40,
  chicken:3.30, beef:27.0, pork:12.0, fish:5.0, salmon:6.0,
  egg:0.75, tofu:2.0, lentils:0.90, beans:1.20,
  milk:1.9, cheese:13.5, butter:24.0, yogurt:1.5,
  bread:1.2, rice:3.0, pasta:1.8, noodles:1.8,
  coffee:0.86, tea:0.06, juice:0.8, water:0.5,
  pizza:2.0, burger:6.0, sandwich:2.0, soup:0.8
};

// --- parsing helpers ----
function isMetadata(text) {
  if (!text) return false;
  const t = text.toLowerCase().replace(/[^\w\s]/g,'').trim();
  const patterns = ['subtotal','total','tax','discount','cash','card','payment','phone','address','thank','invoice','receipt','order','store'];
  if (patterns.includes(t)) return true;
  if (t.length < 30 && patterns.some(k => t.includes(k))) return true;
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(t)) return true;
  if (/^\d{1,2}:\d{2}/.test(t)) return true;
  return false;
}

function isValidItem(text) {
  if (!text) return false;
  let t = text.toLowerCase().trim();
  t = t.replace(/^[^\w]+|[^\w]+$/g, '');
  if (!/[a-z]/.test(t)) return false;
  if (t.length < 2 || t.length > 100) return false;
  if (/^\d+\.?\d*$/.test(t)) return false;
  if (isMetadata(t)) return false;
  return true;
}

function parseReceiptText(fullText) {
  const lines = fullText.split(/\r?\n/);
  const items = [];
  const quantityPattern = /(\d+\.?\d*)\s*(?:x|@|each|qty|quantity|pack|box)/i;

  for (let raw of lines) {
    let line = raw.trim();
    if (!line || line.length < 2) continue;
    if (/^[\$\d\.\-\s,]+$/.test(line)) continue; // skip price-only lines
    if (isMetadata(line)) continue;

    const qtyMatch = line.match(quantityPattern);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1.0;

    let itemName = line.replace(/\d+\.?\d*\s*(?:x|@|each|qty|quantity)/i, '')
                       .replace(/\$[\d.]+/g, '')
                       .replace(/[\d\.\-\s,]+$/g, '')
                       .trim();

    if (isValidItem(itemName) && itemName.length > 2) {
      if (!items.some(i => i.name.toLowerCase() === itemName.toLowerCase())) {
        items.push({ name: itemName, quantity });
      }
    }
  }

  return { items, full_text: fullText };
}

// --- carbon lookup (local fallback + simple heuristics) ---
async function getCarbonValue(itemName) {
  const lower = itemName.toLowerCase().trim();
  if (LOCAL_CARBON_DB.hasOwnProperty(lower)) {
    return { value: LOCAL_CARBON_DB[lower], source: 'Local DB' };
  }

  // heuristic fallback: food default
  return { value: 0.5, source: 'Estimate' };
}

async function calculateCarbonFootprint(items) {
  const breakdown = [];
  let total = 0;
  let matched = 0;
  const notFound = [];

  for (const item of items) {
    const { value, source } = await getCarbonValue(item.name);
    if (value != null) {
      const totalKg = value * (item.quantity || 1);
      breakdown.push({
        item: item.name,
        quantity: item.quantity || 1,
        co2_per_unit_kg: value,
        total_co2_kg: Number(totalKg.toFixed(3)),
        source
      });
      total += totalKg;
      matched++;
    } else {
      notFound.push(item.name);
    }
  }

  return {
    breakdown,
    total_co2_kg: Number(total.toFixed(2)),
    total_co2_lbs: Number((total * 2.20462).toFixed(2)),
    items_matched: matched,
    items_not_found: notFound.length,
    total_items: items.length,
    not_found_list: notFound.slice(0, 10),
    summary: matched ? `Total carbon footprint: ${Number(total.toFixed(2))} kg CO2e` : 'No recognized items found'
  };
}

module.exports = {
  parseReceiptText,
  calculateCarbonFootprint
};
