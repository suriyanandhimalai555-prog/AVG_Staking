import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import userPlanRoutes from "./routes/userPlanRoutes.js"
import withdrawRoutes from "./routes/withdrawRoutes.js";
import levelRoutes from "./routes/levelRoutes.js";
import levelUnlockRoutes from "./routes/levelUnlockRoutes.js";
import rankRoutes from "./routes/rankRoutes.js";
import "./cron/roiCron.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/user-plans", userPlanRoutes);
app.use("/api/withdrawals", withdrawRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/level-unlock", levelUnlockRoutes);
app.use("/api/ranks", rankRoutes);


export default app;