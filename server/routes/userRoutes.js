import express from "express";
import {
  getAllUsers,
  getAllReferrals,
  updateUserStatus,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  addBankDetails,
  getAllBankDetails,
  updateBankStatus,
  deleteBank,
  getMyBankDetails,
  saveMyBankDetails,
  getMyTickets,
  createTicket,
  getAllTickets,
  updateTicketStatus,
  getMyReferrals,
  getMyNetwork,
  getUsersForDropdown,
  getPlansForDropdown,
  getMyDirectIncome,
  getMyLevelIncome,
  getMyDepositStats,
  getAllDirectIncome,
  getAllLevelIncome,
  getAdminDashboard,
  getAdminWallet,
  getMyTeamBusiness,
  getStakingMultiplier,
  updateStakingMultiplier,
  getStakingDivisor,
  updateStakingDivisor,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ 1. Admin list
router.get("/", verifyToken, isAdmin, getAllUsers);
router.get("/referrals", verifyToken, isAdmin, getAllReferrals);

// ✅ 2. USER PROFILE ROUTES (IMPORTANT: keep above /:id)
router.get("/me", verifyToken, getMyProfile);
router.put("/me", verifyToken, updateMyProfile);
router.put("/change-password", verifyToken, changePassword);

// 🔥 USER BANK ROUTES (separate)
router.get("/my-bank", verifyToken, getMyBankDetails);
router.post("/my-bank", verifyToken, saveMyBankDetails);

// user tickets
router.get("/my-tickets", verifyToken, getMyTickets);
router.post("/tickets", verifyToken, createTicket);

// admin fetching user tickets
router.get("/all-tickets", verifyToken, isAdmin, getAllTickets);

router.put("/tickets/:id/status", verifyToken, isAdmin, updateTicketStatus);

// deposit list
router.get("/dropdown/users", verifyToken, getUsersForDropdown);
router.get("/dropdown/plans", verifyToken, getPlansForDropdown);

// user bank details
router.post("/bank", verifyToken, addBankDetails);
router.get("/banks", verifyToken, isAdmin, getAllBankDetails);
router.put("/banks/:id/status", verifyToken, isAdmin, updateBankStatus);
router.delete("/banks/:id", verifyToken, isAdmin, deleteBank);

// user reffral
router.get("/my-referrals", verifyToken, getMyReferrals);

// my network (user)
router.get("/my-network", verifyToken, getMyNetwork);

// my direct income
router.get("/my-direct-income", verifyToken, getMyDirectIncome);

// admin direct income
router.get("/admin/direct-income", verifyToken, isAdmin, getAllDirectIncome);

// my level income
router.get("/my-level-income", verifyToken, getMyLevelIncome);

// admin level income
router.get("/admin/level-income", verifyToken, isAdmin, getAllLevelIncome);

//user dashboard
router.get("/my-deposits-stats", verifyToken, getMyDepositStats);

// admin dashboard
router.get("/admin/dashboard", verifyToken, isAdmin, getAdminDashboard);

// admin wallet topbar
router.get("/admin/wallet", verifyToken, isAdmin, getAdminWallet);

// team business
router.get("/my-team-business", verifyToken, getMyTeamBusiness);

router.get("/staking-multiplier", getStakingMultiplier);
router.post("/staking-multiplier", updateStakingMultiplier);

router.get("/staking-divisor", verifyToken, isAdmin, getStakingDivisor);
router.post("/staking-divisor", verifyToken, isAdmin, updateStakingDivisor);

// ✅ 3. ADMIN ACTIONS (dynamic routes LAST)
router.put("/:id/status", verifyToken, isAdmin, updateUserStatus);
router.put("/:id", verifyToken, isAdmin, updateUser);
router.delete("/:id", verifyToken, isAdmin, deleteUser);

export default router;