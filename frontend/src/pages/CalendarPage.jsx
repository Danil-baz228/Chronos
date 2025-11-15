import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
  parseISO,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "../components/Navbar";
import CalendarManager from "../components/CalendarManager"; // 🆕 импорт управления календарями

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
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit
  const [editEvent, setEditEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // управление навигацией календаря
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: 60,
    category: "arrangement",
    description: "",
  });

  const token = localStorage.getItem("token");

  // 🔹 Загрузка календарей и событий
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [calRes, evRes, holRes] = await Promise.allSettled([
          fetch("http://localhost:5000/api/calendars", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/events", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/events/holidays", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const calData =
          calRes.status === "fulfilled" ? await calRes.value.json() : [];
        const evData =
          evRes.status === "fulfilled" ? await evRes.value.json() : [];
        const holData =
          holRes.status === "fulfilled" && holRes.value.ok
            ? await holRes.value.json()
            : [
                { title: "New Year", date: "2025-01-01", category: "holiday" },
                { title: "Christmas", date: "2025-01-07", category: "holiday" },
              ];

        setCalendars(calData);
        setSelectedCalendar(calData[0]?._id || null);
        setEvents([...evData, ...holData]);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  // 🔹 Фильтрация событий
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter
      ? e.category === categoryFilter
      : true;
    const matchesCalendar = selectedCalendar
      ? !e.calendar || e.calendar === selectedCalendar
      : true;
    return matchesSearch && matchesCategory && matchesCalendar;
  });

  const colorByCategory = {
    arrangement: "#3b82f6",
    reminder: "#facc15",
    task: "#22c55e",
    holiday: "#ef4444",
  };

  // 🔹 Добавить или обновить событие
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const url =
      modalMode === "edit"
        ? `http://localhost:5000/api/events/${editEvent._id}`
        : "http://localhost:5000/api/events";
    const method = modalMode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...newEvent,
        calendar: selectedCalendar,
      }),
    });

    const data = await res.json();

    if (data._id) {
      if (modalMode === "edit") {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === data._id ? data : ev))
        );
      } else {
        setEvents([...events, data]);
      }
      closeModal();
    }
  };

  // 🔹 Удаление события
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Удалить событие?")) return;
    await fetch(`http://localhost:5000/api/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setEvents((prev) => prev.filter((e) => e._id !== id));
    closeModal();
  };

  // 🔹 Открытие модалки
  const openModal = (mode = "add", event = null) => {
    setModalMode(mode);
    if (mode === "edit" && event) {
      setEditEvent(event);
      setNewEvent({
        title: event.title,
        date: format(parseISO(event.date), "yyyy-MM-dd'T'HH:mm"),
        duration: event.duration,
        category: event.category,
        description: event.description,
      });
    } else {
      setNewEvent({
        title: "",
        date: "",
        duration: 60,
        category: "arrangement",
        description: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEvent(null);
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
          <h2>📅 Chronos — Мои календари</h2>

          <div style={styles.filters}>
            {/* 🗂 Управление календарями */}
            <CalendarManager
              calendars={calendars}
              setCalendars={setCalendars}
              token={token}
            />

            <select
              value={selectedCalendar || ""}
              onChange={(e) => setSelectedCalendar(e.target.value)}
            >
              {calendars.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Поиск событий..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Все категории</option>
              <option value="arrangement">Встречи</option>
              <option value="reminder">Напоминания</option>
              <option value="task">Задачи</option>
              <option value="holiday">Праздники</option>
            </select>

            <button style={styles.addButton} onClick={() => openModal("add")}>
              ➕ Новое событие
            </button>
          </div>
        </div>

        {/* 🗓️ Календарь */}
        <div style={styles.calendarWrapper}>
          <Calendar
            localizer={localizer}
            events={filteredEvents.map((e) => {
              const calendar = calendars.find((c) => c._id === e.calendar);
              return {
                ...e,
                start: new Date(e.date),
                end: addMinutes(new Date(e.date), e.duration),
                color: calendar ? calendar.color : colorByCategory[e.category],
              };
            })}
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            date={currentDate}
            onView={(view) => setCurrentView(view)}
            onNavigate={(date) => setCurrentDate(date)}
            views={["month", "week", "day", "agenda"]}
            popup
            selectable
            onSelectEvent={(event) => openModal("edit", event)}
            style={styles.calendar}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color || "#64748b",
                borderRadius: "6px",
                color: "#fff",
                border: "none",
              },
            })}
          />
        </div>
      </div>

      {/* 🔹 Модальное окно для событий */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalMode === "edit" ? "✏️ Редактировать событие" : "➕ Добавить"}
            </h3>
            <form onSubmit={handleSaveEvent} style={styles.form}>
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
              <select
                value={newEvent.category}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, category: e.target.value })
                }
              >
                <option value="arrangement">Встреча</option>
                <option value="reminder">Напоминание</option>
                <option value="task">Задача</option>
              </select>
              <textarea
                placeholder="Описание"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
              />
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveBtn}>
                  💾 Сохранить
                </button>
                {modalMode === "edit" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editEvent._id)}
                    style={styles.deleteBtn}
                  >
                    🗑 Удалить
                  </button>
                )}
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={closeModal}
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
  page: { background: "linear-gradient(135deg, #eef2ff, #e0f2fe)", minHeight: "100vh" },
  container: { padding: "20px 40px" },
  header: { marginBottom: "15px" },
  filters: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  addButton: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  calendarWrapper: {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    background: "white",
  },
  calendar: { height: 600, padding: "10px" },
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
  form: { display: "flex", flexDirection: "column", gap: "10px" },
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
  deleteBtn: {
    background: "#ef4444",
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
