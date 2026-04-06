import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getWithdrawSummary,
  createWithdraw,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawStatus,
  deleteWithdraw
} from "../controllers/withdrawController.js";

const router = express.Router();

router.get("/summary", verifyToken, getWithdrawSummary);
router.get("/my", verifyToken, getMyWithdrawals);
router.post("/", verifyToken, createWithdraw);

router.get("/all", verifyToken, isAdmin, getAllWithdrawals);
router.put("/:id/status", verifyToken, isAdmin, updateWithdrawStatus);
router.delete("/:id", verifyToken, isAdmin, deleteWithdraw);

export default router;