import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getEvents, createEvent } from "../controllers/event.controller.js";

const router = express.Router();

// защищённые маршруты
router.get("/", requireAuth, getEvents);
router.post("/", requireAuth, createEvent);

export default router;
