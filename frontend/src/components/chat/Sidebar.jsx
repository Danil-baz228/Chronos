import React, { useState, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export default function Sidebar({
  chats,
  users,
  onSearch,
  onSelectUser,
  onSelectChat,
  selectedChat,
  currentUser,
  onlineList
}) {
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  if (!currentUser || !currentUser._id) {
    return (
      <div
        style={{
          width: 260,
          background: theme.cardBg,
          borderRight: theme.cardBorder,
          padding: 16,
          color: theme.textMuted,
        }}
      >
        Завантаження...
      </div>
    );
  }

  return (
    <div
      style={{
        width: 260,
        background: theme.cardBg,
        borderRight: theme.cardBorder,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <input
        value={query}
        onChange={handleChange}
        placeholder="Пошук користувача..."
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: theme.cardBorder,
          background: theme.pageBg,
          color: theme.text,
        }}
      />

      <div>
        <h4 style={{ color: theme.textMuted, marginBottom: 8 }}>Мої чати:</h4>

        {chats.length === 0 && (
          <p style={{ color: theme.textMuted }}>Чатів поки немає</p>
        )}

        {chats.map((chat) => {
          if (!Array.isArray(chat.members)) return null;

          const other = chat.members.find(
            (m) => m?._id && m._id !== currentUser._id
          );

          const isOnline = onlineList?.includes(other?._id);

          return (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              style={{
                padding: "10px 14px",
                marginBottom: 8,
                borderRadius: 12,
                background:
                  selectedChat?._id === chat._id
                    ? theme.primarySoft
                    : theme.cardBg,
                cursor: "pointer",
                border:
                  selectedChat?._id === chat._id
                    ? `1px solid ${theme.primary}`
                    : theme.cardBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{other?.fullName || other?.email || "Користувач"}</span>

              {isOnline && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "limegreen",
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {query.length > 0 && (
        <div>
          <h4 style={{ color: theme.textMuted }}>Пошук:</h4>

          {users.map((u) => {
            const isOnline = onlineList?.includes(u._id);

            return (
              <div
                key={u._id}
                onClick={() => onSelectUser(u)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: theme.primarySoft,
                  border: `1px solid ${theme.primary}`,
                  cursor: "pointer",
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {u.fullName} ({u.email})

                {isOnline && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "limegreen",
                    }}
                  ></div>
                )}
              </div>
            );
          })}

          {users.length === 0 && (
            <p style={{ color: theme.textMuted, marginTop: 6 }}>
              Нічого не знайдено
            </p>
          )}
        </div>
      )}
    </div>
  );
}
