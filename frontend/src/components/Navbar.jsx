import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div
      style={{
        background: "#3b82f6",
        color: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "0 0 10px 10px",
      }}
    >
      <h3 style={{ margin: 0 }}>⚡ Chronos</h3>
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>👤 {user.name}</span>
          <button
            onClick={logout}
            style={{
              background: "white",
              color: "#3b82f6",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Выйти
          </button>
        </div>
      ) : (
        <span>Гость</span>
      )}
    </div>
  );
}
