import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  getHolidaysController,
  inviteToEvent,
  removeInvite
} from "../controllers/event.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

router.get("/search", searchEvents);
router.get("/holidays", getHolidaysController);

router.post("/:eventId/invite", inviteToEvent);
router.post("/:eventId/remove-invite", removeInvite);

export default router;
