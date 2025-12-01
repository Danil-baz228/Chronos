import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createChat,
  getMyChats,
  getMessages,
  sendMessage
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/create", requireAuth, createChat);
router.get("/", requireAuth, getMyChats);
router.get("/:chatId/messages", requireAuth, getMessages);
router.post("/:chatId/messages", requireAuth, sendMessage);

export default router;
