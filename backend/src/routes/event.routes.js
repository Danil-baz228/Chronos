import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  getHolidaysController,
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

export default router;
