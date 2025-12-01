import User from "../models/User.js";
import Calendar from "../models/Calendar.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { createHolidayCalendar } from "./calendar.service.js";

export const registerUser = async ({ username, fullName, email, password }) => {
  const existsEmail = await User.findOne({ email });
  if (existsEmail) throw new Error("Email already exists");

  const existsUsername = await User.findOne({ username });
  if (existsUsername) throw new Error("Username already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    fullName,
    email,
    password: hashedPassword,
  });

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

  await createHolidayCalendar(user._id, user.holidayRegion);

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
    },
    token,
  };
};

export const loginUser = async ({ emailOrUsername, password }) => {
  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });

  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
    },
    token,
  };
};
