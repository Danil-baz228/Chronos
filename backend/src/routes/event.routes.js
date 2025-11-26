import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  getHolidaysController,
  inviteToEvent,
  removeInvite,   // ← добавили
} from "../controllers/event.controller.js";

import { requireAuth } from "../middleware/requireAuth.js"; // ← ТВОЙ рабочий импорт

const router = express.Router();

router.use(requireAuth);

// === События ===
router.get("/", getEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

// === Поиск / Праздники ===
router.get("/search", searchEvents);
router.get("/holidays", getHolidaysController);

// === Приглашение ===
router.post("/:eventId/invite", inviteToEvent);

// === Удаление приглашённого ===
router.post("/:eventId/remove-invite", removeInvite);

export default router;
