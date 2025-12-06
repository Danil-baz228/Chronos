import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    const data = await registerUser({ username, fullName, email, password });

    return res.status(201).json({
      message: "User registered successfully",
      user: data.user,
      token: data.token,
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    const data = await loginUser({ emailOrUsername, password });

    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      token: data.token,
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
