import Notification from "../models/Notification.js";

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Не вдалося оновити" });
  }
};
