const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const ejslayouts = require("express-ejs-layouts");
const MongoStore = require("connect-mongo");

const User = require("./models/user");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const leaderboardRoutes = require("./routes/leaderboard");
const communityRoutes = require("./routes/community");
const marketRoutes = require("./routes/market");
const quizRoutes = require("./routes/quiz");
const calculatorRoutes = require("./routes/calculator");
const qrRoutes = require("./routes/qr");
const airefyRoutes = require("./routes/airefy");
const ecoTwin = require("./routes/ecotwin");
const mapRoutes = require("./routes/map");
const receiptRouter = require("./routes/receipt");
const lcaRouter = require("./routes/lca");

dotenv.config();

const app = express();

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// Session Store
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(ejslayouts);
app.set("layout", "layouts/boilerplate.ejs");

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions + Flash
app.use(
  session({
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

// Local Strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);

// Serialize / Deserialize User
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + Global Variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.use("/", userRoutes);
app.use("/", chatRoutes);
app.use("/", leaderboardRoutes);
app.use("/community", communityRoutes);
app.use("/", marketRoutes);
app.use("/", quizRoutes);
app.use("/", calculatorRoutes);
app.use("/", qrRoutes);
app.use("/airefy", airefyRoutes);
app.use("/eco", ecoTwin);
app.use("/map", mapRoutes);
app.use("/api/receipt", receiptRouter);
app.use("/lca", lcaRouter);

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
