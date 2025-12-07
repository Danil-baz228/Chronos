import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Calendar from "../models/Calendar.js";
import Event from "../models/Event.js";
import { createHolidayCalendar } from "../services/calendar.service.js";

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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, fullName, email } = req.body;

    const existsUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existsUsername)
      return res.status(400).json({ error: "Username is already taken" });

    const existsEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existsEmail)
      return res.status(400).json({ error: "Email is already taken" });

    const updated = await User.findByIdAndUpdate(
      userId,
      { username, fullName, email },
      { new: true }
    ).select("-password");

    res.json({ message: "Профіль оновлено", user: updated });
  } catch (e) {
    res.status(500).json({ error: "Profile update failed" });
  }
};

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

    res.json({ message: "Пароль оновлено" });
  } catch (e) {
    res.status(500).json({ error: "Password update failed" });
  }
};

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
      message: "Регіон свят оновлено",
      user: updatedUser,
      holidayCalendar: newHolidayCalendar,
    });

  } catch (e) {
    console.error("updateHolidayRegion ERROR:", e);
    res.status(500).json({ error: "Could not update holiday region" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: "File not uploaded" });
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
    res.status(500).json({ error: "Avatar upload failed" });
  }
};
