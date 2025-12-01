import React, { useState, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export default function ChatInput({ onSend, onTyping }) {
  const { theme } = useContext(ThemeContext);
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);

  const stickers = [
    "🌹","💞","💜","❤️","🧡","💛","💚","💙","🤍","🖤",
    "🔥","✨","⭐","🌟","💫","⚡","🌈",
    "😍","😊","😁","🤭","😎","😇","😈","🥰","😘","😻",
    "👍","👌","🙏","👏","🤝","🙌","✌️","🤌",
    "🐱","🐶","🐼","🐧","🐵","🐸"
  ];

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleInput = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const addSticker = (s) => {
    setText((prev) => prev + s);
    if (onTyping) onTyping();
  };

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        gap: 10,
        borderTop: theme.cardBorder,
        background: theme.cardBg,
        position: "relative",
      }}
    >
      <input
        value={text}
        onChange={handleInput}
        placeholder="Напишіть повідомлення..."
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: 10,
          border: theme.cardBorder,
          background: theme.pageBg,
          color: theme.text,
          outline: "none",
        }}
      />

      <button
        onClick={() => setShowStickers((s) => !s)}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: theme.cardBg,
          border: theme.cardBorder,
          color: theme.text,
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        😊
      </button>

      <button
        onClick={send}
        style={{
          padding: "10px 20px",
          borderRadius: 10,
          background: theme.primarySoft,
          border: `1px solid ${theme.primary}`,
          color: theme.text,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ➤
      </button>

      {showStickers && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "60px",
            background: theme.cardBg,
            border: theme.cardBorder,
            padding: 12,
            borderRadius: 12,
            display: "flex",
            flexWrap: "wrap",
            width: 260,
            gap: 10,
            zIndex: 50,
          }}
        >
          {stickers.map((s) => (
            <div
              key={s}
              onClick={() => addSticker(s)}
              style={{
                fontSize: 26,
                cursor: "pointer",
                padding: 4,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
