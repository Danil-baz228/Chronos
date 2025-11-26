import express from "express";
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  hideCalendar,
  showCalendar,
  addEditor,
  removeEditor,
  addMember,
  removeMember,
  inviteUser,
} from "../controllers/calendar.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getCalendars);
router.post("/", createCalendar);
router.put("/:id", updateCalendar);
router.delete("/:id", deleteCalendar);

// скрыть / показать календарь
router.put("/:id/hide", hideCalendar);
router.put("/:id/show", showCalendar);

// приглашение пользователя
router.post("/:id/invite", inviteUser);

// редакторы
router.post("/:id/add-editor", addEditor);
router.post("/:id/remove-editor", removeEditor);

// участники
router.post("/:id/add-member", addMember);
router.post("/:id/remove-member", removeMember);

export default router;
