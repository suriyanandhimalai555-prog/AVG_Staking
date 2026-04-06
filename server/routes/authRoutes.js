import express from "express";
import { signup, verifySignupOtp, login, adminSignup, loginAsUser } from "../controllers/authController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/admin/signup", adminSignup);
router.post("/login", login);

// admin clicks Login on any user row
router.post("/login-as-user/:id", verifyToken, isAdmin, loginAsUser);

export default router;