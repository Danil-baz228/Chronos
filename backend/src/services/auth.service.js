import User from "../models/User.js";
import Calendar from "../models/Calendar.js";

import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = async ({ name, email, password }) => {
  // Проверка email
  const exists = await User.findOne({ email });
  if (exists) throw new Error("Email already exists");

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаём пользователя
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Создаём главный календарь
  await Calendar.create({
    name: "Main Calendar",
    description: "Default calendar",
    color: "#3b82f6",
    owner: user._id,
    users: [user._id],
  });

  // Генерируем токен
  const token = generateToken(user._id);

  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken(user._id);
  return { user, token };
};
