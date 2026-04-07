// models/quizQuestion.js
const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: String
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [optionSchema], required: true }, // array of { text }
  correctIndex: { type: Number, required: true }, // index into options
  explanation: { type: String, default: "" },
  difficulty: { type: String, enum: ["easy","medium","hard"], default: "easy" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizQuestion", quizQuestionSchema);
