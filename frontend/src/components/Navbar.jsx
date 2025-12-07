// =======================================
// NAVBAR — FIXED MOBILE NOTIFICATIONS + DOCK
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
// NAVBAR MAIN COMPONENT
// =======================================
export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Load user + avatar refresh
  useEffect(() => {
    const handler = () => {
      const updated = JSON.parse(localStorage.getItem("user"));
      setUser(updated || null);
      setAvatarVersion((v) => v + 1);
    };

    window.addEventListener("user_updated", handler);
    window.addEventListener("avatar_updated", handler);

    return () => {
      window.removeEventListener("user_updated", handler);
      window.removeEventListener("avatar_updated", handler);
    };
  }, []);

  const displayName =
    user?.username || user?.fullName || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ==============================
  // NOTIFICATIONS (FIXED MOBILE)
  // ==============================
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load notifications
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

  // Socket events
  useEffect(() => {
    if (!user) return;
    socket.emit("user_online", user._id);

    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on("notification", handler);
    return () => socket.off("notification", handler);
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

  // CLICK OUTSIDE CLOSE (WORKS ON MOBILE)
  useEffect(() => {
    function handler(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("touchstart", handler);
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [notifOpen]);

  const active = (path) => location.pathname.startsWith(path);

  // ==================================================================
  // AUTH PAGE NAVBAR
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
        </div>
      </motion.nav>
    );
  }

  // ==================================================================
  // MAIN NAVBAR
  // ==================================================================
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3000,
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
              <NavButton theme={theme} active={active("/calendar")} onClick={() => navigate("/calendar")}>
                📅 Календар
              </NavButton>

              <NavButton theme={theme} active={active("/chat")} onClick={() => navigate("/chat")}>
                💬 Чати
              </NavButton>
            </div>
          </div>

          {/* RIGHT */}
          <div style={styles.row} className="desktop-right">
            {/* NOTIF BELL */}
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
                      maxWidth: "90vw",          // FIX MOBILE
                      maxHeight: 420,
                      overflowY: "auto",
                      background: theme.cardBg,
                      border: theme.cardBorder,
                      borderRadius: 16,
                      boxShadow: theme.cardShadow,
                      padding: 14,
                      zIndex: 5000,
                    }}
                  >
                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
                        }}
                      >
                        🗑 Очистити
                      </button>
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, opacity: 0.6, textAlign: "center" }}>
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
                            background: n.read ? theme.inputBg : theme.primarySoft,
                            border: n.read ? "1px solid transparent" : `1px solid ${theme.primary}`,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{n.message}</div>
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
              avatarVersion={avatarVersion}
              theme={theme}
              logout={logout}
              navigate={navigate}
            />
          </div>
        </div>
      </motion.nav>

      {/* ===========================
          MOBILE DOCK
      =========================== */}
      <div className="mobile-bottom-nav">
        <button className="mb-btn" onClick={() => navigate("/calendar")}>
          <div className="mb-icon">📅</div>
        </button>

        <button className="mb-btn" onClick={() => navigate("/chat")}>
          <div className="mb-icon">💬</div>
        </button>

        <button
          className="mb-btn"
          onClick={() => setNotifOpen(!notifOpen)}
          style={{ position: "relative" }}
        >
          <div className="mb-icon">🔔</div>

          {unreadCount > 0 && (
            <span className="mb-badge">{unreadCount}</span>
          )}
        </button>

        <button className="mb-btn" onClick={() => navigate("/profile")}>
          <div className="mb-icon">👤</div>
        </button>

        <button
          className="mb-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("open_settings"))}
        >
          <div className="mb-icon">⚙️</div>
        </button>
      </div>

      {/* STYLE FIXES */}
      <style>{`
        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          /* FIX — уведомления теперь не скрываются */
          .desktop-right { display: flex !important; }

          .mobile-bottom-nav {
            display: flex;
            justify-content: space-around;
            align-items: center;
            position: fixed;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 94%;
            padding: 10px 12px;
            border-radius: 24px;
            background: ${theme.cardBg};
            border: ${theme.cardBorder};
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            z-index: 6000;
          }

          .mb-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .mb-icon {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: ${theme.primarySoft};
            border: 1px solid ${theme.primary};
            box-shadow: ${theme.cardShadow};
          }

          .mb-badge {
            position: absolute;
            top: 2px;
            right: 4px;
            background: red;
            color: white;
            font-size: 11px;
            padding: 1px 6px;
            border-radius: 999px;
            font-weight: 700;
          }
        }
      `}</style>
    </>
  );
}

// =======================================
// USER MENU
// =======================================
function UserMenu({ user, avatarLetter, avatarVersion, theme, logout, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
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
              src={`${BASE_URL}${user.avatar}?v=${avatarVersion}`}
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
              zIndex: 6000,
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
