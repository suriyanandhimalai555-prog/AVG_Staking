import express from "express";
import {
  createPlan,
  getPlans,
  updatePlan,
  updatePlanStatus,
  deletePlan
} from "../controllers/planController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/all", verifyToken, getPlans);

router.get("/", verifyToken, isAdmin, getPlans);
router.post("/", verifyToken, isAdmin, createPlan);
router.put("/:id", verifyToken, isAdmin, updatePlan);
router.put("/:id/status", verifyToken, isAdmin, updatePlanStatus);
router.delete("/:id", verifyToken, isAdmin, deletePlan);

export default router;