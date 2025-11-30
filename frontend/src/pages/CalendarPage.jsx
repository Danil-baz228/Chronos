// =======================
//   CalendarPage.jsx
//   Полностью обновлённый файл
//   С поддержкой ролей: owner / editor / member / holiday
// =======================

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

  // calendars
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  // events
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayCache, setHolidayCache] = useState({});

  // ui
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editEvent, setEditEvent] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // date control
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  // event template
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

  // ============================
  //   LOAD CALENDARS + EVENTS
  // ============================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [calRes, evRes] = await Promise.allSettled([
          fetch("http://localhost:5000/api/calendars", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/events", {
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

        setCalendars(calData);
        setSelectedCalendar(calData[0]?._id || null);
        setEvents(evData);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  // ============================
  //   РАСЧЁТ РОЛИ ПОЛЬЗОВАТЕЛЯ
  // ============================
  const [userRole, setUserRole] = useState("member");

  useEffect(() => {
    if (!selectedCalendar || !calendars.length || !currentUserId) return;

    const cal = calendars.find(
      (c) => c._id?.toString() === selectedCalendar.toString()
    );

    if (!cal) return;

    if (cal.isHolidayCalendar) {
      setUserRole("holiday");
      return;
    }

    const owner =
      cal.owner?._id?.toString() === currentUserId ||
      cal.owner?.toString() === currentUserId;

    if (owner) {
      setUserRole("owner");
      return;
    }

    const editor = (cal.editors || []).some(
      (u) => (u._id || u).toString() === currentUserId
    );

    if (editor) {
      setUserRole("editor");
      return;
    }

    const member = (cal.members || []).some(
      (u) => (u._id || u).toString() === currentUserId
    );

    if (member) {
      setUserRole("member");
      return;
    }

    setUserRole("member");
  }, [selectedCalendar, calendars, currentUserId]);

  // ============================
  //   ПРАВА ПОЛЬЗОВАТЕЛЯ
  // ============================
  const canCreateEvents = userRole === "owner" || userRole === "editor";
  const canEditEvents = userRole === "owner" || userRole === "editor";

  // ============================
  //   LOAD HOLIDAYS BY YEAR
  // ============================
  useEffect(() => {
    if (!token) return;

    const year = currentDate.getFullYear();

    if (holidayCache[year]) {
      setHolidays(holidayCache[year]);
      return;
    }

    let cancelled = false;

    const loadHolidays = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/events/holidays?year=${year}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          if (!cancelled) setHolidays([]);
          return;
        }

        const data = await res.json();

        const mapped = data.map((h) => ({
          _id: `holiday-${year}-${h.date}-${h.title}`,
          title: h.title,
          date: h.date,
          allDay: true,
          category: "holiday",
          color: "#ef4444",
          calendar: null,
        }));

        if (cancelled) return;

        setHolidayCache((prev) => ({
          ...prev,
          [year]: mapped,
        }));
        setHolidays(mapped);
      } catch {
        if (!cancelled) setHolidays([]);
      }
    };

    loadHolidays();
    return () => (cancelled = true);
  }, [currentDate, token, holidayCache]);

  const allEvents = [...events, ...holidays];

  // ============================
  //        EVENT FILTER
  // ============================
  const filteredEvents = allEvents.filter((e) => {
    const matchSearch = e.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchCat = categoryFilter ? e.category === categoryFilter : true;

    const matchCal = selectedCalendar
      ? !e.calendar ||
        e.calendar?.toString() === selectedCalendar.toString()
      : true;

    return matchSearch && matchCat && matchCal;
  });

  // ============================
  //   SAVE EVENT (ROLE CHECK)
  // ============================
  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!canCreateEvents) {
      alert("У вас немає прав створювати або змінювати події");
      return;
    }

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
        alert(data.error || "Помилка збереження події");
        return;
      }

      if (modalMode === "edit") {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === data._id ? data : ev))
        );
      } else {
        setEvents((prev) => [...prev, data]);
      }

      closeModal();
    } catch {
      alert("Помилка збереження події");
    }
  };

  // ============================
  //   DELETE EVENT (ROLE CHECK)
  // ============================
  const handleDeleteEvent = async (id) => {
    if (!canEditEvents) {
      alert("У вас немає прав видаляти події");
      return;
    }

    if (!window.confirm("Видалити подію?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Помилка видалення події");
        return;
      }

      setEvents((prev) => prev.filter((e) => e._id !== id));
      setPreviewEvent(null);
      closeModal();
    } catch {
      alert("Помилка видалення події");
    }
  };

  // ============================
  //     МОДАЛКА ОТКРЫТИЕ
  // ============================
  const openModal = useCallback(
    (mode = "add", event = null) => {
      // запрещаем member / holiday
      if (mode === "add" && !canCreateEvents) return;
      if (mode === "edit" && !canEditEvents) return;

      setModalMode(mode);

      if (mode === "edit" && event) {
        setEditEvent(event);

        const start =
          event.start && !event.date
            ? new Date(event.start).toISOString().slice(0, 16)
            : event.date
            ? new Date(event.date).toISOString().slice(0, 16)
            : "";

        const cal = calendars.find(
          (c) => c._id?.toString() === (event.calendar || selectedCalendar)
        );

        setNewEvent({
          title: event.title,
          date: start,
          duration: event.duration || 60,
          category: event.category || "arrangement",
          description: event.description || "",
          color:
            event.color ||
            cal?.color ||
            colorByCategory[event.category] ||
            "#3b82f6",
        });
      } else {
        const cal = calendars.find(
          (c) => c._id?.toString() === selectedCalendar?.toString()
        );

        setEditEvent(null);
        setNewEvent({
          title: "",
          date:
            event?.start?.toISOString()?.slice(0, 16) || "",
          duration: 60,
          category: "arrangement",
          description: "",
          color: cal?.color || "#3b82f6",
        });
      }

      setShowModal(true);
    },
    [calendars, selectedCalendar, canCreateEvents, canEditEvents]
  );

  const closeModal = () => {
    setShowModal(false);
    setEditEvent(null);
  };

  // ============================
  //       LOADING SCREEN
  // ============================
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
        }}
      >
        <p>Завантаження...</p>
      </div>
    );
  }

  // ============================
  //          RENDER PAGE
  // ============================
  return (
    <div style={{ background: theme.pageBg, minHeight: "100vh" }}>
      <Navbar />

      {/* менеджер календарів */}
      <CalendarManager
        calendars={calendars}
        setCalendars={setCalendars}
        token={token}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <CalendarToolbar
          calendars={calendars}
          selectedCalendar={selectedCalendar}
          setSelectedCalendar={setSelectedCalendar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentDate={currentDate}
          onNewEventClick={() => canCreateEvents && openModal("add")}
          token={token}
          canCreateEvents={canCreateEvents}
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
          canCreateEvents={canCreateEvents}
          canEditEvents={canEditEvents}
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
        onEdit={() => canEditEvents && previewEvent && openModal("edit", previewEvent)}
        onDelete={() =>
          canEditEvents && previewEvent && handleDeleteEvent(previewEvent._id)
        }
        onDeleteSelf={() =>
          canEditEvents && previewEvent && handleDeleteEvent(previewEvent._id)
        }
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={() => {}} // будет реализовано позже
        onRemoveInviteUser={() => {}}
        inviteLoading={inviteLoading}
      />
    </div>
  );
}
