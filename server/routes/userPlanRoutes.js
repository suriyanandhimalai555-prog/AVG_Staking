import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  buyPlan,
  getUserPlans,
  getAllUserPlans,
  getROIHistory,
  getUserDeposits,
  getAllROI,
  getAllTransactions,
  getAllTransactionsAdmin,
  deleteUserPlan,
  updateUserPlanStatus,
  getMyTotalROI,
  getPendingUserPlanRequests,
  approveUserPlanRequest,
  updateUserPlan,
} from "../controllers/userPlanController.js";

const router = express.Router();

router.post("/buy", verifyToken, buyPlan);
router.get("/my", verifyToken, getUserPlans);
router.get("/all", verifyToken, getAllUserPlans);

router.get("/roi-history", verifyToken, getROIHistory);
router.get("/roi-all", verifyToken, getAllROI);

router.get("/my-total-roi", verifyToken, getMyTotalROI);

router.get("/deposits", verifyToken, getUserDeposits);

router.get("/transactions", verifyToken, getAllTransactions);

router.get("/transactions-all", verifyToken, isAdmin, getAllTransactionsAdmin);

router.delete("/:id", verifyToken, isAdmin, deleteUserPlan);
router.put("/:id/status", verifyToken, isAdmin, updateUserPlanStatus);

router.get("/requests", verifyToken, getPendingUserPlanRequests);
router.put("/:id/approve", verifyToken, approveUserPlanRequest);

router.put("/:id", verifyToken, updateUserPlan);

export default router;