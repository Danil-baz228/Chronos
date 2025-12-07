import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { io } from "../server.js";

export const createChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.user._id;

    let chat = await Chat.findOne({
      members: { $all: [myId, userId] },
      isGroup: false,
    });

    if (!chat) {
      chat = await Chat.create({
        members: [myId, userId],
      });
    }

    chat = await Chat.findById(chat._id).populate(
      "members",
      "fullName email"
    );

    return res.json(chat);

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Failed to create chat" });
  }
};

export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate("members", "fullName email")
      .populate("lastMessage");

    return res.json(chats);

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Failed to load chats" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ chat: req.params.chatId })
      .populate("sender", "fullName email");

    return res.json(msgs);

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Failed to load messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const msg = await Message.create({
      chat: req.params.chatId,
      sender: req.user._id,
      text: req.body.text,
      sticker: req.body.sticker || null,
    });

    const fullMsg = await Message.findById(msg._id)
      .populate("sender", "fullName email");

    io.to(`chat:${req.params.chatId}`).emit("new_message", fullMsg);

    return res.json(fullMsg);

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Failed to send message" });
  }
};
