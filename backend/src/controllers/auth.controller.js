import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async ({ username, fullName, email, password }) => {
  // проверка уникальности
  const exists = await User.findOne({ 
    $or: [
      { email },
      { username }
    ] 
  });

  if (exists) {
    throw new Error("User with this email or username already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    fullName,
    email,
    password: hashed,
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user,
    token,
  };
};

export const loginUser = async ({ emailOrUsername, password }) => {
  const user = await User.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername },
    ]
  });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user,
    token,
  };
};
