import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getLevelUnlocks,
  createLevelUnlock,
  updateLevelUnlock,
  deleteLevelUnlock,
  toggleLevelUnlockStatus
} from "../controllers/levelUnlockController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getLevelUnlocks);
router.post("/", verifyToken, isAdmin, createLevelUnlock);
router.put("/:id", verifyToken, isAdmin, updateLevelUnlock);
router.delete("/:id", verifyToken, isAdmin, deleteLevelUnlock);
router.put("/:id/toggle", verifyToken, isAdmin, toggleLevelUnlockStatus);

export default router;