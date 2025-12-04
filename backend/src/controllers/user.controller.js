import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Calendar from "../models/Calendar.js";
import Event from "../models/Event.js";
import { createHolidayCalendar } from "../services/calendar.service.js";

// =======================
// Search Users
// =======================
// =======================
// Search Users
// =======================
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query || "";

    if (!query.trim()) return res.json([]);

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("_id fullName email");

    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Search error" });
  }
};

// =======================
// Update Profile
// =======================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, fullName, email } = req.body;

    const existsUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existsUsername)
      return res.status(400).json({ error: "Цей логін вже зайнятий" });

    const existsEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existsEmail)
      return res.status(400).json({ error: "Цей email вже зайнятий" });

    const updated = await User.findByIdAndUpdate(
      userId,
      { username, fullName, email },
      { new: true }
    ).select("-password");

    res.json({ message: "Профіль оновлено", user: updated });
  } catch (e) {
    res.status(500).json({ error: "Помилка оновлення профілю" });
  }
};

// =======================
// Change Password
// =======================
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Incorrect old password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (e) {
    res.status(500).json({ error: "Password update error" });
  }
};

// =======================
// Update Holiday Region
// =======================
export const updateHolidayRegion = async (req, res) => {
  try {
    const userId = req.user._id;
    const { region } = req.body;

    if (!region)
      return res.status(400).json({ error: "Region is required" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { holidayRegion: region },
      { new: true }
    ).select("-password");

    const existingHoliday = await Calendar.findOne({
      owner: userId,
      isHolidayCalendar: true,
    });

    if (existingHoliday) {
      await Event.deleteMany({ calendar: existingHoliday._id });
      await Calendar.deleteOne({ _id: existingHoliday._id });
    }

    const year = new Date().getFullYear();
    const newHolidayCalendar = await createHolidayCalendar(userId, region, year);

    res.json({
      message: "Holiday region updated",
      user: updatedUser,
      holidayCalendar: newHolidayCalendar,
    });

  } catch (e) {
    console.error("❌ updateHolidayRegion ERROR:", e);
    res.status(500).json({ error: "Could not update holiday region" });
  }
};

// =======================
// Upload Avatar
// =======================
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: "Файл не завантажено" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    return res.json({
      message: "Аватар успішно оновлено",
      avatarUrl,
      user: updated,
    });

  } catch (e) {
    console.error("Avatar upload error:", e);
    res.status(500).json({ error: "Помилка завантаження аватару" });
  }
};
