import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";

import Navbar from "../components/Navbar";
import CalendarToolbar from "../components/CalendarToolbar";
import CalendarView from "../components/CalendarView";
import EventModal from "../components/EventModal";
import EventPreview from "../components/EventPreview";
import CalendarManager from "../components/CalendarManager";

import { ThemeContext } from "../context/ThemeContext";

export default function CalendarPage() {
  const { theme } = useContext(ThemeContext);

  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editEvent, setEditEvent] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [previewEvent, setPreviewEvent] = useState(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const colorByCategory = {
    arrangement: "#3b82f6",
    reminder: "#facc15",
    task: "#22c55e",
    holiday: "#ef4444",
  };

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: 60,
    category: "arrangement",
    description: "",
    color: "",
  });

  const token = localStorage.getItem("token");

  // ===========================
  //   ЗАГРУЗКА ДАННЫХ
  // ===========================
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
          calRes.status === "fulfilled" && calRes.value.ok
            ? await calRes.value.json()
            : [];

        const evData =
          evRes.status === "fulfilled" && evRes.value.ok
            ? await evRes.value.json()
            : [];

        const holData =
          holRes.status === "fulfilled" && holRes.value.ok
            ? (await holRes.value.json()).map((h) => ({
                _id: `holiday-${h.date}-${h.title}`,
                title: h.title,
                date: h.date,
                allDay: true,
                category: "holiday",
                color: "#ef4444",
                calendar: calData[0]?._id || null,
              }))
            : [];

        setCalendars(calData);
        setSelectedCalendar(calData[0]?._id || null);
        setEvents([...evData, ...holData]);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  // ===========================
  //   ФИЛЬТРАЦИЯ
  // ===========================
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? e.category === categoryFilter : true;
    const matchesCalendar = selectedCalendar
      ? !e.calendar || e.calendar?.toString() === selectedCalendar?.toString()
      : true;

    return matchesSearch && matchesCategory && matchesCalendar;
  });

  // ===========================
  //   СОХРАНЕНИЕ СОБЫТИЯ
  // ===========================
  const handleSaveEvent = async (e) => {
    e.preventDefault();

    const url =
      modalMode === "edit"
        ? `http://localhost:5000/api/events/${editEvent._id}`
        : "http://localhost:5000/api/events";

    const method = modalMode === "edit" ? "PUT" : "POST";

    try {
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

      if (!res.ok) {
        alert(data.error || "Ошибка сохранения события");
        return;
      }

      if (data._id) {
        if (modalMode === "edit") {
          setEvents((prev) => prev.map((ev) => (ev._id === data._id ? data : ev)));
        } else {
          setEvents((prev) => [...prev, data]);
        }
        closeModal();
      }
    } catch (err) {
      console.error("Ошибка сохранения события:", err);
      alert("Ошибка сохранения события");
    }
  };

  // ===========================
  //   УДАЛЕНИЕ СОБЫТИЯ
  // ===========================
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Удалить событие?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка удаления события");
        return;
      }

      setEvents((prev) => prev.filter((e) => e._id !== id));
      setPreviewEvent(null);
      closeModal();
    } catch (err) {
      console.error("Ошибка удаления события:", err);
      alert("Ошибка удаления события");
    }
  };

  // ===========================
  //   ПРИГЛАШЕНИЕ НА СОБЫТИЕ
  // ===========================
  const handleInviteToEvent = async () => {
    if (!previewEvent || !previewEvent._id) return;
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;

    try {
      setInviteLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/events/${previewEvent._id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: trimmed }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ошибка приглашения");
        return;
      }

      const updatedEvent = data.event || data;

      setEvents((prev) =>
        prev.map((ev) => (ev._id === updatedEvent._id ? updatedEvent : ev))
      );

      setPreviewEvent(updatedEvent);
      setInviteEmail("");
      alert("Приглашение отправлено!");
    } catch (err) {
      console.error("Ошибка приглашения:", err);
      alert("Ошибка приглашения");
    } finally {
      setInviteLoading(false);
    }
  };

  // ===========================
  //   УДАЛЕНИЕ ПРИГЛАШЁННОГО
  // ===========================
  const removeInviteUser = async (value, type) => {
    if (!previewEvent || !previewEvent._id) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/events/${previewEvent._id}/remove-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value, type }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка удаления приглашённого");
        return;
      }

      const updatedEvent = data.event;

      setEvents((prev) =>
        prev.map((ev) => (ev._id === updatedEvent._id ? updatedEvent : ev))
      );

      setPreviewEvent(updatedEvent);
    } catch (err) {
      console.error("Ошибка удаления приглашённого:", err);
      alert("Ошибка удаления приглашённого");
    }
  };

  // ===========================
  //   ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛКИ
  // ===========================
  const openModal = useCallback(
    (mode = "add", event = null) => {
      setModalMode(mode);

      if (mode === "edit" && event) {
        setEditEvent(event);

        const startDate =
          event.start && !event.date
            ? new Date(event.start).toISOString().slice(0, 16)
            : (event.date && new Date(event.date).toISOString().slice(0, 16)) ||
              "";

        const eventCalendarId =
          typeof event.calendar === "string"
            ? event.calendar
            : event.calendar?._id || selectedCalendar;

        const eventCalendar = calendars.find(
          (c) => c._id?.toString() === eventCalendarId?.toString()
        );

        setNewEvent({
          title: event.title || "",
          date: startDate,
          duration: event.duration || 60,
          category: event.category || "arrangement",
          description: event.description || "",
          color:
            event.color ||
            eventCalendar?.color ||
            colorByCategory[event.category] ||
            "#3b82f6",
        });
      } else if (mode === "add" && event && event.start) {
        const startDate = new Date(event.start).toISOString().slice(0, 16);

        const currentCal = calendars.find(
          (c) => c._id?.toString() === selectedCalendar?.toString()
        );

        setNewEvent({
          title: "",
          date: startDate,
          duration: 60,
          category: "arrangement",
          description: "",
          color: currentCal?.color || "#3b82f6",
        });

        setEditEvent(null);
      } else {
        const currentCal = calendars.find(
          (c) => c._id?.toString() === selectedCalendar?.toString()
        );

        setEditEvent(null);
        setNewEvent({
          title: "",
          date: "",
          duration: 60,
          category: "arrangement",
          description: "",
          color: currentCal?.color || "#3b82f6",
        });
      }

      setShowModal(true);
    },
    [calendars, selectedCalendar]
  );

  const closeModal = () => {
    setShowModal(false);
    setEditEvent(null);
  };

  // ===========================
  //   LOADING SCREEN
  // ===========================
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: theme.pageBg,
          color: theme.text,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "4px solid rgba(148,163,184,0.4)",
            borderTopColor: theme.primary,
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: 15 }}>Загрузка календаря...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: theme.pageBg, minHeight: "100vh" }}>
      <Navbar />

      {/* === ВАЖНО: менеджер календарей здесь === */}
      <CalendarManager
        calendars={calendars}
        setCalendars={setCalendars}
        token={token}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 24px 32px",
        }}
      >
        <CalendarToolbar
          calendars={calendars}
          setCalendars={setCalendars}
          selectedCalendar={selectedCalendar}
          setSelectedCalendar={setSelectedCalendar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          currentView={currentView}
          currentDate={currentDate}
          onNewEventClick={() => openModal("add")}
          token={token}
        />

        <CalendarView
          events={filteredEvents}
          calendars={calendars}
          selectedCalendar={selectedCalendar}
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          setPreviewEvent={setPreviewEvent}
          openModal={openModal}
          colorByCategory={colorByCategory}
        />
      </div>

      <EventModal
        isOpen={showModal}
        mode={modalMode}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onClose={closeModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        editEvent={editEvent}
      />

      <EventPreview
        event={previewEvent}
        onClose={() => setPreviewEvent(null)}
        onEdit={() => {
          if (!previewEvent) return;
          openModal("edit", previewEvent);
          setPreviewEvent(null);
        }}
        onDelete={() => previewEvent && handleDeleteEvent(previewEvent._id)}
        onDeleteSelf={() => previewEvent && handleDeleteEvent(previewEvent._id)}
        onInvite={handleInviteToEvent}
        onRemoveInviteUser={removeInviteUser}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteLoading={inviteLoading}
      />
    </div>
  );
}
