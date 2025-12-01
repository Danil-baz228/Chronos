// =======================
//   CalendarPage.jsx — FIXED VERSION
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
import SettingsModal from "../components/settings/SettingsModal";

import { ThemeContext } from "../context/ThemeContext";

export default function CalendarPage() {
  const { theme } = useContext(ThemeContext);

  // === SETTINGS MODAL ===
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open_settings", handler);
    return () => window.removeEventListener("open_settings", handler);
  }, []);

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

  // invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

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
  //   ROLE CALCULATION
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
    if (owner) return setUserRole("owner");

    const editor = (cal.editors || []).some(
      (u) => (u._id || u).toString() === currentUserId
    );
    if (editor) return setUserRole("editor");

    const member = (cal.members || []).some(
      (u) => (u._id || u).toString() === currentUserId
    );
    if (member) return setUserRole("member");

    setUserRole("member");
  }, [selectedCalendar, calendars, currentUserId]);

  const canCreateEvents = userRole === "owner" || userRole === "editor";
  const canEditEvents = userRole === "owner" || userRole === "editor";

  // ============================
  //    LOAD HOLIDAYS API
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
          { headers: { Authorization: `Bearer ${token}` } }
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

  // ============================
  //    MERGE EVENTS CORRECTLY
  // ============================
  const selectedCalObj = calendars.find((c) => c._id === selectedCalendar);

  const allEvents =
    selectedCalObj?.isHolidayCalendar
      ? holidays // ONLY holidays
      : [...events, ...holidays]; // Main Calendar → events + holidays

  // ============================
  //        EVENT FILTER
  // ============================
  const filteredEvents = allEvents.filter((e) => {
    const isHolidayCal = selectedCalObj?.isHolidayCalendar;

    if (isHolidayCal) {
      return e.category === "holiday";
    }

    const matchCal = e.calendar
      ? e.calendar.toString() === selectedCalendar?.toString()
      : true;

    const matchSearch = e.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchCat = categoryFilter ? e.category === categoryFilter : true;

    return matchCal && matchSearch && matchCat;
  });

  // ============================
  //   SAVE EVENT
  // ============================
  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!canCreateEvents) {
      alert("У вас немає прав");
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
        alert(data.error || "Помилка");
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
      alert("Помилка");
    }
  };

  // ============================
  //   DELETE EVENT
  // ============================
  const handleDeleteEvent = async (id) => {
    if (!canEditEvents) {
      alert("У вас немає прав");
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
        alert(data.error || "Помилка");
        return;
      }

      setEvents((prev) => prev.filter((e) => e._id !== id));
      setPreviewEvent(null);
      closeModal();
    } catch {
      alert("Помилка");
    }
  };

  // ============================
  //     MODAL OPEN
  // ============================
  const openModal = useCallback(
    (mode = "add", event = null) => {
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
          date: event?.start?.toISOString()?.slice(0, 16) || "",
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
  //      LOADING SCREEN
  // ============================
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
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
  //         RENDER PAGE
  // ============================
  return (
    <div style={{ background: theme.pageBg, minHeight: "100vh" }}>
      

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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
        onEdit={() =>
          canEditEvents && previewEvent && openModal("edit", previewEvent)
        }
        onDelete={() =>
          canEditEvents && previewEvent && handleDeleteEvent(previewEvent._id)
        }
        onDeleteSelf={() =>
          canEditEvents && previewEvent && handleDeleteEvent(previewEvent._id)
        }
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={() => {}}
        onRemoveInviteUser={() => {}}
        inviteLoading={inviteLoading}
      />
    </div>
  );
}
