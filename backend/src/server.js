import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import { notifyUser } from "./services/notification.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global.io = io;

const onlineUsers = new Map();
global.onlineUsers = onlineUsers;

global.sendNotification = async (userId, data) => {
  try {
    await notifyUser(userId, data);
  } catch (e) {
    console.error("sendNotification error:", e);
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_online", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId.toString(), socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("join_chat", (chatId) => {
    if (!chatId) return;
    console.log(`join chat ${chatId}`);
    socket.join(`chat:${chatId}`);
  });

  socket.on("typing", ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    socket.to(`chat:${chatId}`).emit("typing", { chatId, userId });
  });

  socket.on("stop_typing", ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    socket.to(`chat:${chatId}`).emit("stop_typing", { chatId, userId });
  });

  socket.on("join_calendar", (calendarId) => {
    if (!calendarId) return;
    console.log(`join calendar ${calendarId}`);
    socket.join(`calendar:${calendarId}`);
  });

  socket.on("leave_calendar", (calendarId) => {
    if (!calendarId) return;
    console.log(`leave calendar ${calendarId}`);
    socket.leave(`calendar:${calendarId}`);
  });

  socket.on("disconnect", () => {
    for (const [id, sid] of onlineUsers.entries()) {
      if (sid === socket.id) onlineUsers.delete(id);
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("DB connection error:", err));
