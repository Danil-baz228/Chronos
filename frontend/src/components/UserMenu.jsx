import React, { useState, useRef, useEffect } from "react";

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // Закрытие по клику вне меню
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      {/* Аватарка */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#3b82f6",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          fontWeight: 700,
          userSelect: "none",
        }}
      >
        {user?.fullName?.[0]?.toUpperCase() || "U"}
      </div>

      {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "48px",
            background: "white",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            borderRadius: 12,
            width: 180,
            padding: "8px 0",
            zIndex: 999,
          }}
        >
          <MenuItem label="Профіль" onClick={() => alert("Open profile")} />
          <MenuItem label="Налаштування" onClick={() => alert("Open settings")} />
          <MenuItem label="Вийти" danger onClick={onLogout} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, danger = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 16px",
        fontSize: 14,
        cursor: "pointer",
        color: danger ? "#dc2626" : "#0f172a",
        fontWeight: danger ? 600 : 500,
      }}
      onMouseEnter={(e) =>
        (e.target.style.background = danger
          ? "rgba(220,38,38,0.1)"
          : "rgba(148,163,184,0.18)")
      }
      onMouseLeave={(e) => (e.target.style.background = "transparent")}
    >
      {label}
    </div>
  );
}
