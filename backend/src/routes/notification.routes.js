import express from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

// ====================================
// GET — всі уведомлення користувача
// ====================================
router.get("/", async (req, res) => {
  try {
    const list = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Помилка завантаження уведомлень" });
  }
});

// ====================================
// Позначити ВСІ як прочитані
// ====================================
router.post("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Помилка" });
  }
});

// ====================================
// Очистити ВСІ сповіщення
// ====================================
router.delete("/clear-all", async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Помилка очищення" });
  }
});

// ====================================
// Позначити ОДНЕ як прочитане
// ====================================
router.post("/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Помилка" });
  }
});

export default router;
