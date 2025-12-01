import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import eventRoutes from "./routes/event.routes.js";

// ⚡ ДОДАЙ ЦЕ:
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- подключаем роуты ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/users", userRoutes);

// ⚡ І ЦЕ:
app.use("/api/chat", chatRoutes);

export default app;
