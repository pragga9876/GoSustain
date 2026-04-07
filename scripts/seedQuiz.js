// scripts/seedQuiz.js
require("dotenv").config();
const mongoose = require("mongoose");
const QuizQuestion = require("../models/quizQuestion");

async function run() {
  const db = process.env.MONGO_URI 
  await mongoose.connect(db);

  const questions = [
    {
      question: "Which transport mode typically emits the least CO₂ per passenger-km?",
      options: [{ text: "Car (single occupant)" }, { text: "Bus" }, { text: "Airplane" }, { text: "Motorbike" }],
      correctIndex: 1,
      explanation: "Public buses carry many passengers and have lower emissions per person than private cars or planes."
    },
    {
      question: "Approximately how much CO₂ (kg) does 1 kWh of electricity produce on average (grid avg)?",
      options: [{ text: "0.05 kg" }, { text: "0.5 kg" }, { text: "5 kg" }, { text: "50 kg" }],
      correctIndex: 1,
      explanation: "Grid averages vary but around 0.5 kg CO₂ per kWh is a reasonable global estimate for many grids."
    },
    {
      question: "Which diet choice generally has the lowest carbon footprint?",
      options: [{ text: "Vegan" }, { text: "Vegetarian" }, { text: "Pescatarian" }, { text: "High-meat diet" }],
      correctIndex: 0,
      explanation: "Plant-based diets generally have lower emissions than meat-heavy diets."
    },
    {
      question: "What household action reduces energy use the most?",
      options: [{ text: "Switch to LED bulbs" }, { text: "Use energy-efficient appliances" }, { text: "Turn off lights when not in use" }, { text: "Install solar panels" }],
      correctIndex: 3,
      explanation: "While many actions help, installing solar electricity can reduce grid electricity demand significantly; smaller actions also help."
    },
    {
      question: "Which of these is a simple way to reduce travel emissions?",
      options: [{ text: "Carpool" }, { text: "Drive faster" }, { text: "Use air-conditioning more" }, { text: "Idle the engine while parked" }],
      correctIndex: 0,
      explanation: "Carpooling reduces per-person emissions by sharing trips."
    }
  ];

  for (const q of questions) {
    const exists = await QuizQuestion.findOne({ question: q.question });
    if (!exists) {
      await QuizQuestion.create(q);
      console.log("Added:", q.question);
    }
  }
  console.log("Done seeding quiz");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
