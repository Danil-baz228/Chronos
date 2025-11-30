// backend/src/services/auth.service.js
import User from "../models/User.js";
import Calendar from "../models/Calendar.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { createHolidayCalendar } from "./calendar.service.js";

export const registerUser = async ({ name, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // 1. Главный календарь
  await Calendar.create({
    name: "Main Calendar",
    description: "Default calendar",
    color: "#3b82f6",
    owner: user._id,
    editors: [],
    members: [],
    isMain: true,
    isHidden: false,
  });

  // 2. Календарь праздников (UA, текущий год)
  await createHolidayCalendar(user._id, "UA");

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};
