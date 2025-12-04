import Notification from "../models/Notification.js";
import { io } from "../server.js";

export const notifyUser = async (userId, data) => {
  const notif = await Notification.create({
    user: userId,
    ...data,
  });

  const socketId = global.onlineUsers?.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", notif);
  }

  return notif;
};
