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
  removeCalendarMember
} from "../controllers/calendar.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Все маршруты защищены
router.use(requireAuth);

// =========================
// CALENDAR CRUD
// =========================
router.get("/", getCalendars);
router.post("/", createCalendar);
router.put("/:id", updateCalendar);
router.delete("/:id", deleteCalendar);

// =========================
// Hide / Show
// =========================
router.put("/:id/hide", hideCalendar);
router.put("/:id/show", showCalendar);

// =========================
// Invite user
// =========================
router.post("/:id/invite", inviteUser);

// =========================
// Members & Roles
// =========================

// изменить роль (member/editor)
router.post("/:id/members/update", updateMemberRole);

// удалить участника или редактора
router.post("/:id/members/remove", removeCalendarMember);

export default router;
