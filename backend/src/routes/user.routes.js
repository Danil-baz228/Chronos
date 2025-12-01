import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  searchUsers,
  updateProfile,
  updatePassword,
  updateHolidayRegion
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", requireAuth, searchUsers);
router.put("/update", requireAuth, updateProfile);
router.put("/change-password", requireAuth, updatePassword);

// ⚡️ Новый маршрут
router.put("/holiday-region", requireAuth, updateHolidayRegion);

export default router;
