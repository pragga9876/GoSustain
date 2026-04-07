// scripts/seedMarket.js
require("dotenv").config();
const mongoose = require("mongoose");
const MarketItem = require("../models/marketItem");

async function run() {
  const db = process.env.MONGO_URI 
  await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });

  const items = [
    { title: "Plant 1 Tree (virtual)", description: "Support a local sapling program. (Virtual)", costPoints: 100 },
    { title: "Plant 5 Trees (virtual)", description: "Sponsor 5 saplings in community projects.", costPoints: 450 },
    { title: "Fund a Clean-up", description: "Support neighborhood clean-up operations.", costPoints: 200 },
    { title: "Donate to NGO (mock)", description: "Fund micro-donation to partner NGO (mock).", costPoints: 1000 }
  ];

  for (const it of items) {
    const exists = await MarketItem.findOne({ title: it.title });
    if (!exists) {
      await MarketItem.create(it);
      console.log("Added:", it.title);
    }
  }
  console.log("Done seeding market");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
