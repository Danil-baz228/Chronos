import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  // страницы авторизации
  const isAuthPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  // состояние пользователя
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // следим за изменением user в localStorage
  useEffect(() => {
    const handler = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const displayName =
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Користувач";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const active = (path) =>
    location.pathname.startsWith(path) ? theme.primarySoft : "transparent";

  // меню
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ==================================
  // NAVBAR для Login / Register
  // ==================================
  if (isAuthPage) {
    return (
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: 60,
          zIndex: 50,
          background: "transparent",
          borderBottom: "none",
          boxShadow: "none",
          backdropFilter: `blur(${theme.blur})`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            height: "100%",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: theme.primarySoft,
              color: theme.primary,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ch
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("toggle_theme"))
              }
              style={miniBtn(theme)}
            >
              🎨 Тема
            </button>

            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("toggle_language"))
              }
              style={miniBtn(theme)}
            >
              🌐 Мова
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ==================================
  // ОСНОВНОЙ NAVBAR (авторизованный)
  // ==================================
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: `blur(${theme.blur})`,
        background: theme.cardBg,
        borderBottom: theme.cardBorder,
        boxShadow: theme.cardShadow,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ЛЕВАЯ ЧАСТЬ */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            onClick={() => navigate("/calendar")}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: theme.primarySoft,
              color: theme.primary,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ch
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              padding: 4,
              borderRadius: 999,
              background: theme.inputBg,
              border: theme.cardBorder,
            }}
          >
            <button
              onClick={() => navigate("/calendar")}
              style={navBtn(theme, active("/calendar"))}
            >
              📅 Календар
            </button>

            <button
              onClick={() => navigate("/chat")}
              style={navBtn(theme, active("/chat"))}
            >
              💬 Чати
            </button>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: theme.primarySoft,
              border: `1px solid ${theme.primary}`,
              cursor: "pointer",
              color: theme.text,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: theme.primarySoft,
                color: theme.primary,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: 700,
              }}
            >
              {avatarLetter}
            </div>

            {displayName}
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "105%",
                right: 0,
                minWidth: 180,
                background: theme.cardBg,
                border: theme.cardBorder,
                borderRadius: 12,
                boxShadow: theme.cardShadow,
                padding: "10px 0",
              }}
            >
              <MenuItem label="Профіль" onClick={() => navigate("/profile")} />
              <MenuItem
                label="Налаштування"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open_settings"))
                }
              />
              <MenuItem label="Вийти" danger onClick={logout} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ---------- UI HELPERS ----------
function MenuItem({ label, danger, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 16px",
        cursor: "pointer",
        color: danger ? "#ef4444" : "inherit",
        fontWeight: danger ? 700 : 500,
      }}
    >
      {label}
    </div>
  );
}

const miniBtn = (theme) => ({
  padding: "6px 12px",
  borderRadius: 10,
  border: `1px solid ${theme.primary}`,
  background: theme.primarySoft,
  color: theme.text,
  cursor: "pointer",
});

const navBtn = (theme, bg) => ({
  padding: "8px 16px",
  borderRadius: 999,
  background: bg,
  border: "none",
  cursor: "pointer",
  color: theme.text,
  fontWeight: 600,
});
