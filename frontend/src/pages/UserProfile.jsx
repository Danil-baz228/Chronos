// src/pages/UserProfile.jsx

import React, { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { BASE_URL } from "../config";

export default function UserProfile() {
  const { theme } = useContext(ThemeContext);

  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  // ================================
  // LOAD USER
  // ================================
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  // ================================
  // LOAD MY EVENTS
  // ================================
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const events = await res.json();

        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) return;

        const userId = storedUser._id;

        const my = events.filter((ev) => {
          const creatorId =
            (ev.creator && (ev.creator._id || ev.creator)) || null;

          return (
            creatorId &&
            creatorId.toString() === userId.toString() &&
            ev.category !== "holiday" &&
            !ev.invitedFrom
          );
        });

        setMyEvents(my);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (!user) return null;

  // =====================================
  // AVATAR URL
  // =====================================
  const avatarUrl = user.avatar ? `${BASE_URL}${user.avatar}` : null;

  // =====================================
  // UPLOAD AVATAR
  // =====================================
const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch(`${BASE_URL}/api/users/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error || "Помилка");

    // 🔥 Оновлюємо дані користувача
    const updated = { ...user, avatar: data.avatarUrl };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // 🔥 Сповіщаємо Navbar та інші компоненти про зміну
    window.dispatchEvent(new Event("user_updated"));
    window.dispatchEvent(new Event("avatar_updated"));

  } catch (e) {
    console.error("Avatar upload error:", e);
    alert("Не вдалося завантажити аватар");
  }
};


  // ================================
  // STYLES
  // ================================
  const card = {
    background: theme.cardBg,
    border: theme.cardBorder,
    boxShadow: theme.cardShadow,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    color: theme.text,
  };

  const eventItem = {
    background: theme.primarySoft,
    borderLeft: `4px solid ${theme.primary}`,
    padding: "10px 14px",
    marginBottom: 10,
    borderRadius: 8,
  };

  // ================================
  // RENDER
  // ================================
  return (
    <div style={{ minHeight: "100vh", background: theme.pageBg }}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 40 }}>
        
        {/* ============================= USER CARD ============================= */}
        <div style={{ ...card, display: "flex", gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              cursor: "pointer",
              border: `2px solid ${theme.primary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: theme.primarySoft,
            }}
            onClick={() => fileInputRef.current.click()}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ fontSize: 34, fontWeight: 700, color: theme.primary }}
              >
                {user.fullName ? user.fullName[0].toUpperCase() : "U"}
              </span>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <h2 style={{ margin: 0 }}>👤 Профіль користувача</h2>
            <p style={{ opacity: 0.8 }}>
              Управління даними та власними подіями.
            </p>

            <div style={{ marginTop: 12, lineHeight: "1.7" }}>
              <div>
                <b>Ім’я:</b> {user.fullName || "—"}
              </div>
              <div>
                <b>Email:</b> {user.email}
              </div>
              <div>
                <b>ID:</b> {user._id}
              </div>
            </div>
          </div>
        </div>

        {/* ============================= MY EVENTS ONLY ============================= */}
        <div style={{ ...card }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>📅 Мої події</h3>

          {loading ? (
            <p>Завантаження...</p>
          ) : myEvents.length === 0 ? (
            <p style={{ opacity: 0.7 }}>У вас ще немає власних подій.</p>
          ) : (
            myEvents.map((ev) => (
              <div key={ev._id} style={eventItem}>
                <div style={{ fontWeight: 600 }}>{ev.title}</div>
                <div style={{ opacity: 0.7 }}>
                  📆 {new Date(ev.date || ev.start).toLocaleString()}
                </div>
                {ev.description && (
                  <div style={{ opacity: 0.8, marginTop: 4 }}>
                    📝 {ev.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
