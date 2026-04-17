import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import userPlanRoutes from "./routes/userPlanRoutes.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import levelRoutes from "./routes/levelRoutes.js";
import levelUnlockRoutes from "./routes/levelUnlockRoutes.js";
import rankRoutes from "./routes/rankRoutes.js";

import "./cron/roiCron.js";

const app = express();

/* =========================
   ✅ CORS CONFIG (FIXED)
========================= */

// 🔁 Replace with your real frontend domain
const allowedOrigins = [
  "http://localhost:5173",
  "https://avgstake.com",
  "https://www.avgstake.com", // ⚠️ MUST CHANGE
];

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌐 Request Origin:", origin);

      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        return callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

// ⚠️ Handle preflight explicitly (important for Jio)
app.options("*", cors());

/* =========================
   ✅ MIDDLEWARE
========================= */

app.use(express.json());

/* =========================
   ✅ HEALTH CHECK (IMPORTANT)
========================= */

app.get("/", (req, res) => {
  res.send("🚀 Backend is running");
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

/* =========================
   ✅ ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/user-plans", userPlanRoutes);
app.use("/api/withdrawals", withdrawRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/level-unlock", levelUnlockRoutes);
app.use("/api/ranks", rankRoutes);

/* =========================
   ✅ ERROR HANDLER (IMPORTANT)
========================= */

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  if (err.message === "CORS not allowed") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;