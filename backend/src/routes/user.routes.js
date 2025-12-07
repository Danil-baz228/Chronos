import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  searchUsers,
  updateProfile,
  updatePassword,
  updateHolidayRegion
} from "../controllers/user.controller.js";

const router = express.Router();

import uploadAvatar from "../middleware/uploadAvatar.js";
import { uploadAvatar as uploadAvatarController } from "../controllers/user.controller.js";

router.post("/avatar", requireAuth, uploadAvatar, uploadAvatarController);


router.get("/search", requireAuth, searchUsers);
router.put("/update", requireAuth, updateProfile);
router.put("/change-password", requireAuth, updatePassword);

router.put("/holiday-region", requireAuth, updateHolidayRegion);

export default router;
