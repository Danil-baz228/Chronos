import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";

import calendarRoutes from "./routes/calendar.routes.js";
import eventRoutes from "./routes/event.routes.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- подключаем роуты ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/calendars", calendarRoutes);

export default app;
