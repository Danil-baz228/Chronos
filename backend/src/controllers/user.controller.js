import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Calendar from "../models/Calendar.js";       // ✅ ДОЛЖЕН БЫТЬ ЗДЕСЬ
import Event from "../models/Event.js";             // ✅ ДЛЯ удаления событий
import { createHolidayCalendar } from "../services/calendar.service.js";

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

    // Update user region
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { holidayRegion: region },
      { new: true }
    ).select("-password");

    // Find old calendar
    const existingHoliday = await Calendar.findOne({
      owner: userId,
      isHolidayCalendar: true,
    });

    // Delete old calendar & its events
    if (existingHoliday) {
      await Event.deleteMany({ calendar: existingHoliday._id });
      await Calendar.deleteOne({ _id: existingHoliday._id });
    }

    // Create new calendar
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
