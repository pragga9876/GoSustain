# 🌍 GoSustain

GoSustain is a sustainability web app that helps users track carbon emissions, manage eco-friendly activities, and discover personalized recommendations for lower-impact living.

## 🚀 What it does

- Tracks emissions from travel, home energy, food & diet, and waste.
- Provides a carbon calculator and lifestyle insights.
- Includes gamification with quizzes, leaderboards, community features, and rewards.
- Supports authentication, global flash notifications, and file-based receipt parsing.

## ✨ Key Features

- User registration and login with Passport.js
- Activity tracking and personal summary dashboards
- Carbon footprint calculator for diet, travel, home energy, and recycling
- Gamified quizzes, leaderboards, and achievement badges
- Community discussion pages and eco-friendly marketplace
- Receipt parsing and analytics via integrated receipt utilities
- QR generator and map features for engagement
- Responsive UI with EJS view templates and modular frontend assets

## 🧰 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Passport.js + passport-local-mongoose
- EJS + express-ejs-layouts
- Axios, fetch, Chart.js, Multer, PDFKit, QRCode, Sharp

## 📁 Project Structure

- `app.js` — main Express server and route registration
- `routes/` — application route handlers
- `models/` — Mongoose schemas and data models
- `views/` — EJS page templates and layouts
- `public/` — static assets (CSS, JS, images)
- `utils/` — helper modules for carbon calculation, receipts, insights, and rewards
- `data/` — static data files used by the app
- `uploads/` — uploaded assets and receipt files
- `receipt-parser/` — separate receipt parsing frontend and backend utilities

## ⚙️ Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd GoSustain
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with:

   ```env
   MONGO_URI=mongodb://localhost:27017/gosustain
   SESSION_SECRET=your-secret-key
   PORT=3000
   ```

4. Start the application

   ```bash
   node app.js
   ```

5. Open in browser

   ```text
   http://localhost:3000
   ```

## 🛠️ Environment Variables

- `MONGO_URI` — MongoDB connection string
- `SESSION_SECRET` — secret key for session encryption
- `PORT` — optional Express server port

## 🚀 Available Scripts

- `npm start` — start the server via `node app.js`
- `npm test` — placeholder test command

## 💡 Notes

- Ensure MongoDB is running before launching the app.
- Customize routes and views in `routes/` and `views/` to add new sustainability features.
- The app uses session-based authentication and flash messaging for user interactions.

## 🙌 Contributing

Contributions are welcome! If you want to add new calculators, improve the UI, or connect real carbon APIs, feel free to open an issue or submit a pull request.

## 📜 License

This project is released under the ISC License.

