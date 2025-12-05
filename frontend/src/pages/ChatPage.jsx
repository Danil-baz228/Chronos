import React, { useState, useRef, useEffect, useContext } from "react";
import Sidebar from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { ThemeContext } from "../context/ThemeContext";
import { socket } from "../socket";
import Navbar from "../components/Navbar";

export default function ChatPage() {
  const { theme } = useContext(ThemeContext);

  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineList, setOnlineList] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const chatRef = useRef(null);


  const loadChats = async () => {
    const res = await fetch("${BASE_URL}/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setChats(data);
  };

  useEffect(() => {
    loadChats();
  }, []);

  // announce online
  useEffect(() => {
    if (currentUser) socket.emit("user_online", currentUser._id);
  }, []);

  // listen online list
  useEffect(() => {
    socket.on("online_users", setOnlineList);
    return () => socket.off("online_users");
  }, []);

 
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const res = await fetch(
      `${BASE_URL}/api/users/search?query=${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setUsers(data);
  };

  // ======================
  // START CHAT
  // ======================
  const startChatWithUser = async (user) => {
    const res = await fetch("${BASE_URL}/api/chat/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: user._id }),
    });

    const chat = await res.json();

    setChats((prev) =>
      prev.some((c) => c._id === chat._id) ? prev : [...prev, chat]
    );

    openChat(chat);
  };

  // ======================
  // OPEN CHAT
  // ======================
  const openChat = async (chat) => {
    setSelectedChat(chat);
    socket.emit("join_chat", chat._id);

    const res = await fetch(
      `${BASE_URL}/api/chat/${chat._id}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let msgs = await res.json();

    msgs = msgs.map((m) => ({
      ...m,
      fromMe: m.sender._id === currentUser._id,
    }));

    setMessages(msgs);
  };

  // ======================
  // NEW MESSAGE SOCKET
  // ======================
  useEffect(() => {
    if (!selectedChat) return;

    const handler = (msg) => {
      if (msg.chat !== selectedChat._id) return;

      setMessages((prev) => [
        ...prev,
        { ...msg, fromMe: msg.sender._id === currentUser._id },
      ]);
    };

    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  }, [selectedChat]);

  // ======================
  // TYPING INDICATOR
  // ======================
  useEffect(() => {
    if (!selectedChat) return;

    const handleTyping = ({ chatId, userId }) => {
      if (chatId === selectedChat._id && userId !== currentUser._id) {
        setTypingUser(userId);
      }
    };

    const stopTyping = ({ chatId }) => {
      if (chatId === selectedChat._id) setTypingUser(null);
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", stopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", stopTyping);
    };
  }, [selectedChat]);

  // ======================
  // SEND MESSAGE
  // ======================
  const sendMessage = async (text) => {
    await fetch(
      `${BASE_URL}/api/chat/${selectedChat._id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );
  };

  // typing event
  const emitTyping = () => {
    if (!selectedChat) return;

    socket.emit("typing", {
      chatId: selectedChat._id,
      userId: currentUser._id,
    });

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        chatId: selectedChat._id,
        userId: currentUser._id,
      });
    }, 1500);
  };

  // ======================
  // RENDER
  // ======================
  return (
    <div style={{ minHeight: "100vh", background: theme.pageBg }}>
     

      {/* CHAT LAYOUT */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 70px)",
          marginTop: 0,
        }}
      >
        {/* SIDEBAR */}
        <Sidebar
          chats={chats}
          users={users}
          onSearch={searchUsers}
          onSelectUser={startChatWithUser}
          onSelectChat={openChat}
          selectedChat={selectedChat}
          currentUser={currentUser}
          onlineList={onlineList}
        />

        {/* CHAT WINDOW */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ChatWindow
            selectedChat={selectedChat}
            messages={messages}
            typingUser={typingUser}
            chatRef={chatRef}
            onSend={sendMessage}
            onlineList={onlineList}
            emitTyping={emitTyping}
          />
        </div>
      </div>
    </div>
  );
}
