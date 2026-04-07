import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getRanks,
  createRank,
  updateRank,
  deleteRank,
  toggleRankStatus,
  getRanksUser,
  getAllUsersRewards,
  updateRewardStatus,
  getRewardClaimsAdmin,
  saveRewardClaim,
  getUserRewardClaims,
  updateClaimMonthStatus,
  closeRewardClaim,
} from "../controllers/rankController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getRanks);
router.get("/user", verifyToken, getRanksUser);
router.post("/", verifyToken, isAdmin, createRank);
router.put("/:id", verifyToken, isAdmin, updateRank);
router.delete("/:id", verifyToken, isAdmin, deleteRank);
router.put("/:id/toggle", verifyToken, isAdmin, toggleRankStatus);

router.get("/admin", verifyToken, isAdmin, getAllUsersRewards);
router.post("/status", verifyToken, isAdmin, updateRewardStatus);

// new reward claim pages
router.get("/claims/admin", verifyToken, isAdmin, getRewardClaimsAdmin);
router.post("/claims", verifyToken, isAdmin, saveRewardClaim);
router.get("/claims/user", verifyToken, getUserRewardClaims);
router.post("/claims/month-status", verifyToken, isAdmin, updateClaimMonthStatus);
router.post("/claims/close", verifyToken, closeRewardClaim);

export default router;