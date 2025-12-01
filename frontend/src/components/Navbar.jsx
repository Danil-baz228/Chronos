import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  // === USER STATE ===
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );

  // === LISTEN TO localStorage UPDATES ===
  useEffect(() => {
    const syncUser = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      setUser(updatedUser);
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // AUTO CLOSE DROPDOWN
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Користувач";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Highlight active page
  const active = (path) =>
    location.pathname.startsWith(path)
      ? theme.primarySoft
      : "transparent";

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
          gap: 20,
        }}
      >
        {/* LEFT: LOGO + NAVIGATION TABS */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* LOGO */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: theme.primarySoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.primary,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
            onClick={() => navigate("/calendar")}
          >
            Ch
          </div>

          {/* NAVIGATION TABS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: 4,
              borderRadius: 999,
              border: theme.cardBorder,
              background: theme.inputBg,
            }}
          >
            <button
              onClick={() => navigate("/calendar")}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: active("/calendar"),
                border: "none",
                cursor: "pointer",
                color: theme.text,
                fontWeight: 600,
              }}
            >
              📅 Календар
            </button>

            <button
              onClick={() => navigate("/chat")}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: active("/chat"),
                border: "none",
                cursor: "pointer",
                color: theme.text,
                fontWeight: 600,
              }}
            >
              💬 Чати
            </button>
          </div>
        </div>

        {/* RIGHT: AVATAR + MENU */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: theme.primarySoft,
              borderRadius: 999,
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
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
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
                boxShadow: theme.cardShadow,
                borderRadius: 12,
                padding: "10px 0",
                zIndex: 1000,
              }}
            >
              <MenuItem
                label="Профіль"
                onClick={() => navigate("/profile")}
                theme={theme}
              />
              <MenuItem
                label="Налаштування"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open_settings"))
                }
                theme={theme}
              />
              <MenuItem label="Вийти" onClick={logout} danger theme={theme} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MenuItem({ label, onClick, theme, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 16px",
        cursor: "pointer",
        color: danger ? "#ef4444" : theme.text,
        fontWeight: danger ? 700 : 500,
      }}
    >
      {label}
    </div>
  );
}
