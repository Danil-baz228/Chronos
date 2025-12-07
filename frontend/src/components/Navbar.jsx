// =======================================
// NAVBAR WITH FULL MOBILE VERSION + NOTIFICATIONS RESTORED
// =======================================

import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../config";

// =======================================
// LOGO
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
        cursor: "pointer",
        boxShadow: theme.cardShadow,
        whiteSpace: "nowrap",
      }}
    >
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-10, 0, 0, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.4 }}
      >
        C
      </motion.span>

      <motion.span
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: [0, 0, 1, 1, 0], x: [30, 15, 0, 0, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.4 }}
      >
        hronus
      </motion.span>
    </motion.div>
  );
}

// =======================================
// NAVBAR
// =======================================
export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [mobileMenu, setMobileMenu] = useState(false);

  // LOAD USER
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
    "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ==============================
  // NOTIFICATIONS (FULL SYSTEM)
  // ==============================
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load notifications from API
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/notifications`, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const list = await res.json();
        setNotifications(list);
      } catch (err) {
        console.log("Notif load error", err);
      }
    };

    load();
  }, [user]);

  // Socket listener
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
    await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await fetch(`${BASE_URL}/api/notifications/clear-all`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    setNotifications([]);
  };

  // Close popup on click outside
  useEffect(() => {
    function handleClick(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const active = (path) => location.pathname.startsWith(path);

  // ==================================================================
  // MOBILE AUTH NAVBAR
  // ==================================================================
  if (isAuthPage) {
    return (
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          height: 60,
          zIndex: 100,
          background: "transparent",
        }}
      >
        <div style={styles.rowBetween}>
          <ChronusLogo theme={theme} onClick={() => navigate("/login")} />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={miniBtn(theme)}
              onClick={() => window.dispatchEvent(new CustomEvent("toggle_theme"))}
            >
              🎨
            </button>

            <button
              style={miniBtn(theme)}
              onClick={() =>
                window.dispatchEvent(new CustomEvent("toggle_language"))
              }
            >
              🌐
            </button>
          </div>
        </div>
      </motion.nav>
    );
  }

  // ==================================================================
  // MAIN NAVBAR
  // ==================================================================
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        backdropFilter: `blur(${theme.blur})`,
        background: theme.cardBg,
        borderBottom: theme.cardBorder,
        boxShadow: theme.cardShadow,
      }}
    >
      <div style={styles.rowBetween}>
        {/* LEFT */}
        <div style={styles.row}>
          <ChronusLogo theme={theme} onClick={() => navigate("/calendar")} />

          {/* DESKTOP NAV */}
          <div className="desktop-nav" style={styles.desktopNav}>
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
        <div style={styles.row}>
          {/* ====================== */}
          {/* NOTIFICATION BELL */}
          {/* ====================== */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
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
                <span
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
                </span>
              )}
            </button>

            {/* POPUP */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  ref={notifRef}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
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
                    zIndex: 3000,
                  }}
                >
                  {/* Buttons */}
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

                  {/* Notifications */}
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
                      <div
                        key={n._id}
                        onClick={() => markAsRead(n._id)}
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
                          transition: "0.15s",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {n.message}
                        </div>
                        <div style={{ opacity: 0.6, fontSize: 12 }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* USER MENU */}
          <UserMenu
            user={user}
            avatarLetter={avatarLetter}
            theme={theme}
            logout={logout}
            navigate={navigate}
          />
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: 16,
              background: theme.cardBg,
              borderBottom: theme.cardBorder,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <NavButton
              theme={theme}
              onClick={() => {
                setMobileMenu(false);
                navigate("/calendar");
              }}
            >
              📅 Календар
            </NavButton>

            <NavButton
              theme={theme}
              onClick={() => {
                setMobileMenu(false);
                navigate("/chat");
              }}
            >
              💬 Чати
            </NavButton>

            <NavButton
              theme={theme}
              onClick={() => {
                setMobileMenu(false);
                navigate("/profile");
              }}
            >
              👤 Профіль
            </NavButton>

            <NavButton
              theme={theme}
              onClick={() => {
                setMobileMenu(false);
                window.dispatchEvent(new CustomEvent("open_settings"));
              }}
            >
              ⚙️ Налаштування
            </NavButton>

            <button style={miniBtn(theme)} onClick={() => logout()}>
              🚪 Вийти
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE STYLE */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-right { display: none !important; }
          .mobile-burger { display: block !important; }
        }
      `}</style>
    </motion.nav>
  );
}

// =======================================
// USER MENU COMPONENT
// =======================================
function UserMenu({ user, avatarLetter, theme, logout, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
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
            color: theme.primary,
            fontWeight: 700,
          }}
        >
          {user?.avatar ? (
            <img
              src={`${BASE_URL}${user.avatar}`}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            avatarLetter
          )}
        </div>

        {user?.username}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            style={{
              position: "absolute",
              right: 0,
              top: "105%",
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =======================================
// HELPERS
// =======================================
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

function NavButton({ theme, active, onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      animate={{
        backgroundColor: active ? theme.primarySoft : "transparent",
      }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        cursor: "pointer",
        fontWeight: 600,
        border: "none",
        color: theme.text,
      }}
    >
      {children}
    </motion.button>
  );
}

const miniBtn = (theme) => ({
  padding: "6px 12px",
  borderRadius: 10,
  border: `1px solid ${theme.primary}`,
  background: theme.primarySoft,
  cursor: "pointer",
  fontWeight: 600,
});

// =======================================
// INLINE STYLES
// =======================================
const styles = {
  row: { display: "flex", alignItems: "center", gap: 16 },
  rowBetween: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  desktopNav: {
    display: "flex",
    gap: 10,
    padding: 4,
    borderRadius: 999,
  },
};
