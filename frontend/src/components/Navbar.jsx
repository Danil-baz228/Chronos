// src/components/Navbar.jsx

import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../config";
// =======================================
// 🔥 АНИМИРОВАННЫЙ ЛОГОТИП "Chronus"
// Сначала большая C, потом "hronus" выезжает, всё гаснет, цикл
// =======================================
function ChronusLogo({ theme, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 14px",
        borderRadius: 12,
        background: theme.primarySoft,
        color: theme.primary,
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: 0.6,
        cursor: "pointer",
        boxShadow: theme.cardShadow,
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {/* Большая C */}
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [-10, 0, 0, 0],
        }}
        transition={{
          duration: 2.6,
          times: [0, 0.15, 0.7, 1],
          repeat: Infinity,
          repeatDelay: 0.4,
          ease: "easeOut",
        }}
        style={{ fontSize: 22 }}
      >
        C
      </motion.span>

      {/* "hronus" выезжает справа */}
      <motion.span
        initial={{ opacity: 0, x: 30 }}
        animate={{
          opacity: [0, 0, 1, 1, 0],
          x: [30, 15, 0, 0, 0],
        }}
        transition={{
          duration: 2.6,
          times: [0, 0.15, 0.35, 0.75, 1],
          repeat: Infinity,
          repeatDelay: 0.4,
          ease: "easeOut",
        }}
        style={{ fontSize: 18 }}
      >
        hronus
      </motion.span>
    </motion.div>
  );
}

export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  // ==============================
  // AUTH PAGE DETECTION
  // ==============================
  const authPages = ["/", "/login", "/register"];
  const isAuthPage = authPages.includes(location.pathname);

  // ==============================
  // USER
  // ==============================
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  useEffect(() => {
    const handler = () => setUser(JSON.parse(localStorage.getItem("user")));
    window.addEventListener("user_updated", handler);
    window.addEventListener("avatar_updated", handler);
    return () => {
      window.removeEventListener("user_updated", handler);
      window.removeEventListener("avatar_updated", handler);
    };
  }, []);

  const displayName =
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Користувач";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ==============================
  // NOTIFICATIONS
  // ==============================
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await fetch("${BASE_URL}/api/notifications", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const list = await res.json();
        setNotifications(list);
      } catch (err) {
        console.error("Notif load error:", err);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    socket.emit("user_online", user._id);

    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => socket.off("notification");
  }, [user]);

  const markAsRead = async (id) => {
    await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await fetch("${BASE_URL}/api/notifications/read-all", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await fetch("${BASE_URL}/api/notifications/clear-all", {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    setNotifications([]);
  };

  // ==============================
  // CLICK OUTSIDE HANDLING
  // ==============================
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);

      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen, menuOpen]);

  const active = (path) =>
    location.pathname.startsWith(path) ? true : false;

  // =====================================================
  // SPECIAL AUTH NAVBAR
  // =====================================================
  if (isAuthPage) {
    return (
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          height: 60,
          zIndex: 50,
          background: "transparent",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Логотип Chronus с анимацией */}
          <ChronusLogo
            theme={theme}
            onClick={() => navigate("/login")}
          />

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
      </motion.nav>
    );
  }

  // =====================================================
  // MAIN NAVBAR with animation
  // =====================================================
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
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
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* 🔥 Анимированный логотип Chronus */}
          <ChronusLogo
            theme={theme}
            onClick={() => navigate("/calendar")}
          />

          {/* Навигация с анимацией кнопок */}
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
            <NavButton
              theme={theme}
              active={active("/calendar")}
              onClick={() => navigate("/calendar")}
            >
              📅 Календар
            </NavButton>

            <NavButton
              theme={theme}
              active={active("/chat")}
              onClick={() => navigate("/chat")}
            >
              💬 Чати
            </NavButton>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                fontSize: 22,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: theme.text,
                position: "relative",
              }}
            >
              🔔
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "red",
                    color: "white",
                    fontSize: 12,
                    padding: "1px 6px",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  ref={notifRef}
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "110%",
                    width: 320,
                    maxHeight: 420,
                    overflowY: "auto",
                    background: theme.cardBg,
                    border: theme.cardBorder,
                    borderRadius: 16,
                    boxShadow: theme.cardShadow,
                    padding: 14,
                    zIndex: 2000,
                  }}
                >
                  {/* Controls */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={markAllAsRead}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: theme.primarySoft,
                        color: theme.primary,
                        border: theme.cardBorder,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Прочитати всі
                    </button>

                    <button
                      onClick={clearAll}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      🗑 Очистити
                    </button>
                  </div>

                  {/* Messages */}
                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: 20,
                        opacity: 0.6,
                        textAlign: "center",
                      }}
                    >
                      Немає повідомлень
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <motion.div
                        key={n._id}
                        onClick={() => markAsRead(n._id)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          marginBottom: 10,
                          cursor: "pointer",
                          background: n.read
                            ? theme.inputBg
                            : theme.primarySoft,
                          border: n.read
                            ? "1px solid transparent"
                            : `1px solid ${theme.primary}`,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {n.message}
                        </div>
                        <div style={{ opacity: 0.6, fontSize: 12 }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* USER MENU */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
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
                  overflow: "hidden",
                  background: theme.primarySoft,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 700,
                  color: theme.primary,
                }}
              >
                {user?.avatar ? (
                  <img
                    src={`${BASE_URL}${user.avatar}`}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              {displayName}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
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
                  <MenuItem
                    label="Профіль"
                    onClick={() => navigate("/profile")}
                  />
                  <MenuItem
                    label="Налаштування"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("open_settings"))
                    }
                  />
                  <MenuItem label="Вийти" danger onClick={logout} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

// ---- HELPERS ----
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

function NavButton({ theme, active, onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: active ? theme.primarySoft : "transparent",
      }}
      transition={{ duration: 0.2 }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        color: theme.text,
        fontWeight: 600,
      }}
    >
      {children}
    </motion.button>
  );
}
