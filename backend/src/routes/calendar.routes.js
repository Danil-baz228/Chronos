import express from "express";
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  hideCalendar,
  showCalendar,
  inviteUser,
  updateMemberRole,
  removeCalendarMember,
  updateCalendarNotifications
} from "../controllers/calendar.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getCalendars);
router.post("/", createCalendar);
router.put("/:id", updateCalendar);
router.delete("/:id", deleteCalendar);

router.put("/:id/hide", hideCalendar);
router.put("/:id/show", showCalendar);

router.post("/:id/invite", inviteUser);

router.post("/:id/members/update", updateMemberRole);
router.post("/:id/members/remove", removeCalendarMember);

router.patch("/:id/notifications", updateCalendarNotifications);

export default router;
