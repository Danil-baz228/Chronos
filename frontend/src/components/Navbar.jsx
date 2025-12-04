import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../socket";

export default function Navbar() {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  // ==============================
  // AUTH PAGES DETECTION
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
    const handler = () =>
      setUser(JSON.parse(localStorage.getItem("user")));
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
        const res = await fetch("http://localhost:5000/api/notifications", {
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
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await fetch("http://localhost:5000/api/notifications/read-all", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await fetch("http://localhost:5000/api/notifications/clear-all", {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

    setNotifications([]);
  };

  // ==============================
  // CLICK OUTSIDE HANDLERS
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
    location.pathname.startsWith(path) ? theme.primarySoft : "transparent";

  // =====================================================
  // SPECIAL AUTH NAVBAR (Login / Register)
  // =====================================================
  if (isAuthPage) {
    return (
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          height: 60,
          zIndex: 50,
          background: "transparent",
          boxShadow: "none",
          borderBottom: "none",
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
          {/* LOGO */}
          <div
            onClick={() => navigate("/login")}
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

  // =====================================================
  // MAIN NAVBAR (authorized)
  // =====================================================
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
        {/* LEFT */}
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
              style={navBtn(theme, active("/calendar"))}
              onClick={() => navigate("/calendar")}
            >
              📅 Календар
            </button>

            <button
              style={navBtn(theme, active("/chat"))}
              onClick={() => navigate("/chat")}
            >
              💬 Чати
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* NOTIFICATIONS */}
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

            {notifOpen && (
              <div
                ref={notifRef}
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
              </div>
            )}
          </div>

          {/* USER MENU */}
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
                    src={`http://localhost:5000${user.avatar}`}
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
      </div>
    </nav>
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

const navBtn = (theme, bg) => ({
  padding: "8px 16px",
  borderRadius: 999,
  background: bg,
  border: "none",
  cursor: "pointer",
  color: theme.text,
  fontWeight: 600,
});
