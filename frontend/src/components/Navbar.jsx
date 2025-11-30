// src/components/Navbar.jsx
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext, useTranslation } from "../context/LanguageContext";

export default function Navbar() {
  const { theme, themeName, setThemeName } = useContext(ThemeContext);
  const { lang, setLang } = useContext(LanguageContext);
  const { t } = useTranslation();

  const user = JSON.parse(localStorage.getItem("user"));

  const navStyle = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: `blur(${theme.blur})`,
    background:
      theme.name === "glass"
        ? "linear-gradient(90deg, rgba(15,23,42,0.85), rgba(15,23,42,0.65))"
        : theme.cardBg,
    borderBottom: theme.cardBorder,
    boxShadow: theme.cardShadow,
  };

  const pillBase = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid transparent",
    fontSize: 12,
    cursor: "pointer",
    background: "transparent",
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav style={navStyle}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* LOGO + TABS */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: theme.primarySoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.primary,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Ch
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 4,
              borderRadius: 999,
              background:
                theme.name === "glass"
                  ? "rgba(15,23,42,0.8)"
                  : "rgba(148,163,184,0.15)",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            {[t("navbar.calendar"), t("navbar.tasks"), t("navbar.analytics")].map(
              (label, index) => (
                <button
                  key={index}
                  style={{
                    ...pillBase,
                    color: index === 0 ? theme.text : theme.textMuted,
                    background:
                      index === 0 ? theme.primarySoft : "transparent",
                    borderColor:
                      index === 0 ? theme.primary : "transparent",
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* SWITCHERS + PROFILE / LOGOUT */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Theme Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: theme.textMuted,
            }}
          >
            <span>{t("navbar.theme")}:</span>
            <div
              style={{
                display: "flex",
                padding: 3,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  theme.name === "glass"
                    ? "rgba(15,23,42,0.75)"
                    : "rgba(148,163,184,0.08)",
              }}
            >
              {["light", "dark", "glass"].map((name) => (
                <button
                  key={name}
                  onClick={() => setThemeName(name)}
                  style={{
                    ...pillBase,
                    padding: "4px 9px",
                    fontSize: 11,
                    textTransform: "capitalize",
                    color:
                      themeName === name ? theme.text : theme.textMuted,
                    background:
                      themeName === name ? theme.primarySoft : "transparent",
                    borderColor:
                      themeName === name ? theme.primary : "transparent",
                  }}
                >
                  {t(`navbar.${name}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Language Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: theme.textMuted,
            }}
          >
            <span>{t("navbar.lang")}:</span>
            <div
              style={{
                display: "flex",
                padding: 3,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  theme.name === "glass"
                    ? "rgba(15,23,42,0.75)"
                    : "rgba(148,163,184,0.08)",
              }}
            >
              {["uk", "en"].map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  style={{
                    ...pillBase,
                    padding: "4px 9px",
                    fontSize: 11,
                    color:
                      lang === code ? theme.text : theme.textMuted,
                    background:
                      lang === code ? theme.primarySoft : "transparent",
                    borderColor:
                      lang === code ? theme.primary : "transparent",
                  }}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Profile + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleProfileClick}
              style={{
                ...pillBase,
                padding: "6px 14px",
                background: theme.primarySoft,
                borderColor: theme.primary,
                color: theme.text,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              👤 {user?.fullName || "Профіль"}
            </button>

            <button
              onClick={handleLogout}
              style={{
                ...pillBase,
                padding: "6px 14px",
                background: "#ef4444",
                borderColor: "#ef4444",
                color: "white",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              🚪 Вийти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
