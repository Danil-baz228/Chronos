import React, { useContext, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  selectedChat,
  messages,
  typingUser,
  chatRef,
  onSend,
  onlineList,
  emitTyping,
  onBack
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
        height: "100%",
        background: theme.pageBg,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: theme.cardBorder,
          background: theme.cardBg,
          color: theme.text,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginRight: 8,
              fontSize: 20,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.text,
            }}
          >
            ←
          </button>
        )}

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

      {/* SCROLLABLE MESSAGES */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
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
                maxWidth: "70%",
                wordWrap: "break-word",
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

      {/* FIXED INPUT */}
      <div
        style={{
          padding: "12px 16px",
          background: theme.cardBg,
          borderTop: theme.cardBorder,
          flexShrink: 0,
        }}
      >
        <ChatInput onSend={onSend} emitTyping={emitTyping} />
      </div>
    </div>
  );
}
