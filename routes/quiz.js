// routes/quiz.js (replace file)
const express = require("express");
const router = express.Router();
const QuizQuestion = require("../models/quizQuestion");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");

// Points map by difficulty
const pointsByDifficulty = {
  easy: 10,
  medium: 15,
  hard: 25
};

// helper: pick N random questions
async function getRandomQuestions(n = 5) {
  const total = await QuizQuestion.countDocuments();
  if (total === 0) return [];
  const limit = Math.min(n, total);
  const agg = await QuizQuestion.aggregate([{ $sample: { size: limit } }]);
  return agg;
}

// normalize date to YYYY-MM-DD (UTC) for daily checks
function toDateKey(d) {
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// GET /quiz — show quiz (if user already took today, send cooldown flag)
router.get("/quiz", async (req, res) => {
  try {
    const questions = await getRandomQuestions(5);
    let takenToday = false;
    if (req.user && req.user.lastQuizAt) {
      const lastKey = toDateKey(req.user.lastQuizAt);
      const todayKey = toDateKey(new Date());
      takenToday = (lastKey === todayKey);
    }
    res.render("quiz/index", {
      title: "Eco Quiz | Equil",
      pageCSS: ["quiz"],
      currentUser: req.user,
      questions,
      takenToday
    });
  } catch (err) {
    console.error("Quiz load error:", err);
    req.flash("error", "Failed to load quiz");
    res.redirect("/");
  }
});

// POST /quiz/submit — evaluate quiz, enforce daily limit, award points and badges
router.post("/quiz/submit", async (req, res) => {
  try {
    // Enforce daily limit if logged in
    if (req.user && req.user.lastQuizAt) {
      const lastKey = toDateKey(req.user.lastQuizAt);
      const todayKey = toDateKey(new Date());
      if (lastKey === todayKey) {
        req.flash("error", "You have already taken the quiz today. Try again tomorrow.");
        return res.redirect("/quiz");
      }
    }

    // Gather question IDs from form: we used hidden inputs qid_<idx> and answers a_<qid>
    const qidKeys = Object.keys(req.body).filter(k => k.startsWith("qid_"));
    // preserve submission order:
    const qids = qidKeys
      .map(k => ({ key: k, val: req.body[k] }))
      .sort((a,b) => a.key.localeCompare(b.key))
      .map(x => x.val);

    // extract answers map: a_<qid> = selectedIndex
    const answers = {};
    Object.keys(req.body).forEach(k => {
      if (k.startsWith("a_")) {
        const qid = k.slice(2);
        answers[qid] = parseInt(req.body[k], 10);
      }
    });

    // fetch questions used
    const questions = await QuizQuestion.find({ _id: { $in: qids } }).lean();
    const qmap = {};
    questions.forEach(q => { qmap[q._id.toString()] = q; });

    let correctCount = 0;
    let pointsEarned = 0;
    const details = [];

    // iterate in submitted order
    qids.forEach(qid => {
      const q = qmap[qid];
      if (!q) return;
      const selected = Number.isFinite(answers[qid]) ? answers[qid] : null;
      const correct = q.correctIndex;
      const isCorrect = (selected !== null && selected === correct);
      if (isCorrect) {
        correctCount++;
        // points depend on question difficulty (default to easy if missing)
        const diff = q.difficulty || "easy";
        const pts = pointsByDifficulty[diff] || pointsByDifficulty.easy;
        pointsEarned += pts;
      }
      details.push({
        qid,
        question: q.question,
        options: q.options,
        selected,
        correct,
        explanation: q.explanation,
        difficulty: q.difficulty || "easy",
        isCorrect
      });
    });

    const totalQuestions = qids.length || details.length || 0;
    const scorePercent = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;

    // update user if logged in
    let updatedUser = null;
    if (req.user) {
      const user = await User.findById(req.user._id);
      // add points
      user.points = (user.points || 0) + pointsEarned;
      // update lastQuizAt to now
      user.lastQuizAt = new Date();

      // award badge if score >= 80 and user doesn't have the badge
      const badgeId = "quiz_master";
      const alreadyHas = Array.isArray(user.badges) && user.badges.some(b => b.id === badgeId);
      if (scorePercent >= 80 && !alreadyHas) {
        const newBadge = { id: badgeId, name: "🏅 Quiz Master", description: "Scored 80%+ on an eco quiz", earnedAt: new Date() };
        user.badges = user.badges || [];
        user.badges.push(newBadge);
        user.badgesEarned = (user.badges.length || 0);
        req.flash("success", "Congrats! You earned the Quiz Master badge 🎉");
      }

      await user.save({ validateBeforeSave: false });
      updatedUser = user;
    }

    // Render result page
    res.render("quiz/result", {
      title: "Quiz Result | Equil",
      pageCSS: ["quiz"],
      currentUser: req.user,
      correctCount,
      total: totalQuestions,
      details,
      pointsEarned,
      updatedUser,
      scorePercent
    });

  } catch (err) {
    console.error("Quiz submit error:", err);
    req.flash("error", "Failed to evaluate quiz");
    res.redirect("/quiz");
  }
});

module.exports = router;
