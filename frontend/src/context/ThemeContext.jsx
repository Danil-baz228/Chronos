// src/context/ThemeContext.jsx
import React, { createContext, useState, useMemo, useEffect } from "react";

export const ThemeContext = createContext();

const THEMES = {
  light: {
    name: "light",
    pageBg: "linear-gradient(135deg, #f9fafb, #e5f0ff)",
    cardBg: "rgba(255,255,255,0.96)",
    cardBorder: "1px solid rgba(148,163,184,0.35)",
    cardShadow: "0 18px 45px rgba(15,23,42,0.08)",
    text: "#0f172a",
    textMuted: "#6b7280",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.08)",
    danger: "#ef4444",
    dangerSoft: "rgba(239,68,68,0.08)",
    inputBg: "rgba(248,250,252,0.9)",
    blur: "12px",
  },

  dark: {
    name: "dark",
    pageBg: "radial-gradient(circle at top, #1f2933, #020617)",
    cardBg: "rgba(15,23,42,0.96)",
    cardBorder: "1px solid rgba(148,163,184,0.4)",
    cardShadow: "0 24px 60px rgba(0,0,0,0.7)",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    primary: "#60a5fa",
    primarySoft: "rgba(96,165,250,0.12)",
    danger: "#f97373",
    dangerSoft: "rgba(248,113,113,0.12)",
    inputBg: "rgba(15,23,42,0.9)",
    blur: "18px",
  },

  glass: {
    name: "glass",
    pageBg:
      "radial-gradient(circle at 0% 0%, #38bdf8 0, transparent 55%), radial-gradient(circle at 100% 100%, #6366f1 0, #020617 60%)",
    cardBg: "rgba(15,23,42,0.78)",
    cardBorder: "1px solid rgba(148,163,184,0.55)",
    cardShadow: "0 28px 70px rgba(15,23,42,0.85)",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    primary: "#38bdf8",
    primarySoft: "rgba(56,189,248,0.16)",
    danger: "#f97373",
    dangerSoft: "rgba(248,113,113,0.18)",
    inputBg: "rgba(15,23,42,0.82)",
    blur: "22px",
  },
};

export function ThemeProvider({ children }) {
  // Load from localStorage or default to glass
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem("themeName") || "glass";
  });

  // Save on change
  useEffect(() => {
    localStorage.setItem("themeName", themeName);
  }, [themeName]);

  // Allow Navbar to change theme via CustomEvent
  useEffect(() => {
    const handler = () => {
      setThemeName((prev) => {
        if (prev === "light") return "dark";
        if (prev === "dark") return "glass";
        return "light";
      });
    };

    window.addEventListener("toggle_theme", handler);
    return () => window.removeEventListener("toggle_theme", handler);
  }, []);

  const theme = useMemo(() => THEMES[themeName] || THEMES.glass, [themeName]);

  const value = useMemo(
    () => ({
      theme,
      themeName,
      setThemeName,
    }),
    [theme, themeName]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
