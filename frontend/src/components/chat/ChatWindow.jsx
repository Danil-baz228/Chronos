import React, { useContext, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  selectedChat,
  messages,
  typingUser,
  chatRef,
  onSend,
  onlineList
}) {
  const { theme } = useContext(ThemeContext);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  if (!selectedChat || !selectedChat.members) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: theme.textMuted,
        }}
      >
        👉 Виберіть чат
      </div>
    );
  }

  const other = selectedChat.members.find(
    (m) => m?._id !== currentUser?._id
  );

  const isOnline = onlineList?.includes(other?._id);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: theme.pageBg,
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: theme.cardBorder,
          background: theme.cardBg,
          color: theme.text,
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        👤 {other?.fullName || other?.email}

        {isOnline && (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "limegreen",
            }}
          />
        )}
      </div>

      <div
        ref={chatRef}
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto",
          background: theme.pageBg,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: msg.fromMe ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: msg.fromMe ? theme.primarySoft : theme.cardBg,
                border: msg.fromMe
                  ? `1px solid ${theme.primary}`
                  : theme.cardBorder,
                color: theme.text,
                maxWidth: "60%",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typingUser && (
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "flex-start",
              color: theme.textMuted,
              fontStyle: "italic",
            }}
          >
            Печатает…
          </div>
        )}
      </div>

      <div style={{ position: "sticky", bottom: 0, zIndex: 20 }}>
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
}
