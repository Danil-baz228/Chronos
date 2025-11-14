import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "../components/Navbar";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: 60,
  });

  // 🔹 Загружаем события
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
      } catch (err) {
        console.error("Ошибка загрузки событий:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 🔹 Добавляем событие
  const handleAddEvent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Вы не авторизованы");

    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newEvent.title,
        date: newEvent.date,
        duration: newEvent.duration,
        category: "arrangement",
      }),
    });

    const data = await res.json();
    if (data._id) {
      setEvents([...events, data]);
      setNewEvent({ title: "", date: "", duration: 60 });
      setShowModal(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderWrapper}>
        <div style={styles.loader}></div>
        <p>Загрузка календаря...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h2>📅 Chronos — Мой календарь</h2>
          <button style={styles.addButton} onClick={() => setShowModal(true)}>
            ➕ Новое событие
          </button>
        </div>

        <div style={styles.calendarWrapper}>
          <Calendar
            localizer={localizer}
            events={events.map((e) => ({
              title: e.title,
              start: new Date(e.date),
              end: addMinutes(new Date(e.date), e.duration),
            }))}
            startAccessor="start"
            endAccessor="end"
            style={styles.calendar}
          />
        </div>
      </div>

      {/* 🔹 Модальное окно для добавления событий */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()} // блокирует закрытие при клике внутри
          >
            <h3>➕ Добавить событие</h3>
            <form onSubmit={handleAddEvent} style={styles.form}>
              <input
                type="text"
                placeholder="Название"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                required
              />
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Длительность (мин)"
                value={newEvent.duration}
                onChange={(e) =>
                  setNewEvent({
                    ...newEvent,
                    duration: Number(e.target.value),
                  })
                }
                required
              />
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveBtn}>
                  Сохранить
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 Стили
const styles = {
  page: {
    background: "linear-gradient(135deg, #eef2ff, #e0f2fe)",
    minHeight: "100vh",
  },
  container: {
    padding: "20px 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addButton: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
    transition: "0.2s",
  },
  calendarWrapper: {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    background: "white",
  },
  calendar: {
    height: 600,
    padding: "10px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "400px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  saveBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#f3f4f6",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  loaderWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "18px",
  },
  loader: {
    width: "40px",
    height: "40px",
    border: "5px solid #ccc",
    borderTop: "5px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
