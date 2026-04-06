import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  toggleLevelStatus
} from "../controllers/levelController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getLevels);
router.post("/", verifyToken, isAdmin, createLevel);
router.put("/:id", verifyToken, isAdmin, updateLevel);
router.delete("/:id", verifyToken, isAdmin, deleteLevel);
router.put("/:id/toggle", verifyToken, isAdmin, toggleLevelStatus);

export default router;