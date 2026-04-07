// tempAssignBadges.js
// Run this file once to assign random badges to all users
require("dotenv").config();
const mongoose = require('mongoose');
const User = require("../models/user");

// List of sample badges
const sampleBadges = [
  { name: 'Eco Warrior', description: 'Completed 5 eco-activities' },
  { name: 'Carbon Cutter', description: 'Saved 50 kg CO₂' },
  { name: 'Sustainable Star', description: 'Logged activities for 7 days straight' },
  { name: 'Green Hero', description: 'Used eco-friendly transport 10 times' },
  { name: 'Planet Protector', description: 'Reduced waste consistently' },
];

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', async () => {
  console.log('Connected to DB');

  try {
    const users = await User.find({});
    for (let user of users) {
      const randomCount = Math.floor(Math.random() * sampleBadges.length) + 1; // 1 to N badges
      const randomBadges = [];

      // pick random badges
      for (let i = 0; i < randomCount; i++) {
        const badge = sampleBadges[Math.floor(Math.random() * sampleBadges.length)];
        // avoid duplicates
        if (!randomBadges.some(b => b.name === badge.name)) {
          randomBadges.push({ ...badge, earnedAt: new Date() });
        }
      }

      user.badges = randomBadges;
      await user.save();
      console.log(`Assigned ${randomBadges.length} badges to ${user.name}`);
    }

    console.log('All users updated!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
});
