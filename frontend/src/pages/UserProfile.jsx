import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function UserProfile() {
  const { theme } = useContext(ThemeContext);

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ============================
  //  LOAD USER FROM LOCALSTORAGE
  // ============================
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  // ============================
  //  LOAD EVENTS
  // ============================
  useEffect(() => {
    if (!token) return;

    const loadEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.warn("Cannot load events");
          setEvents([]);
          return;
        }

        const data = await res.json();
        setEvents(data);
      } catch (e) {
        console.error("Error loading events", e);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [token]);

  if (!user) {
    return null; // поки useEffect робить redirect
  }

  // ============================
  //  STYLES
  // ============================

  const cardStyle = {
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
    color: theme.text,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.pageBg,
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
      
        {/* USER CARD */}
        <div style={{ ...cardStyle, display: "flex", gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: theme.primarySoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
              color: theme.primary,
            }}
          >
            {user.fullName ? user.fullName[0].toUpperCase() : "U"}
          </div>

          <div>
            <h2 style={{ margin: 0 }}>👤 Профіль користувача</h2>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Управління власною інформацією та подіями.
            </p>

            <div style={{ marginTop: 14, lineHeight: "1.7" }}>
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

        {/* STATISTICS */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 12 }}>📊 Статистика</h3>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div
              style={{
                flex: "1 1 200px",
                padding: 16,
                background: theme.primarySoft,
                borderRadius: 12,
                border: `1px solid ${theme.primary}`,
              }}
            >
              <b>Подій:</b> {events.length}
            </div>
            <div
              style={{
                flex: "1 1 200px",
                padding: 16,
                background: theme.primarySoft,
                borderRadius: 12,
                border: `1px solid ${theme.primary}`,
              }}
            >
              <b>Категорій:</b> 4
            </div>
          </div>
        </div>

        {/* EVENTS LIST */}
        <div style={cardStyle}>
          <h3>📅 Мої події</h3>

          {loading ? (
            <p>Завантаження...</p>
          ) : events.length === 0 ? (
            <p style={{ opacity: 0.7 }}>У вас поки немає подій.</p>
          ) : (
            events.map((ev) => (
              <div key={ev._id} style={eventItem}>
                <div style={{ fontWeight: 600 }}>{ev.title}</div>
                <div style={{ opacity: 0.7, fontSize: 14 }}>
                  📆 {new Date(ev.date || ev.start).toLocaleString()}
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Категорія: {ev.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
