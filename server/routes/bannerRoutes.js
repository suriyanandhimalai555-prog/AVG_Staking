import express from "express";
import multer from "multer";
import {
  deleteBannerSlide,
  getApprovedBannerUsers,
  getPublicBannerSlides,
  toggleBannerSlideStatus,
  upsertBannerSlide,
} from "../controllers/bannerController.js";

// replace these with your existing auth middlewares
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.get("/admin/approved-users", verifyToken, isAdmin, getApprovedBannerUsers);
router.get("/public", getPublicBannerSlides);
router.post(
  "/upload",
  verifyToken,
  isAdmin,
  upload.single("image"),
  upsertBannerSlide
);
router.patch("/:id/toggle", verifyToken, isAdmin, toggleBannerSlideStatus);
router.delete("/:id", verifyToken, isAdmin, deleteBannerSlide);

export default router;