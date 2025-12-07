import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";
import { BASE_URL } from "../config";
import Navbar from "../components/Navbar";
import CalendarToolbar from "../components/CalendarToolbar";
import CalendarView from "../components/CalendarView";
import EventModal from "../components/EventModal";
import EventPreview from "../components/EventPreview";
import CalendarManager from "../components/CalendarManager";
import SettingsModal from "../components/settings/SettingsModal";

import YearView from "./YearView";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";

import { socket } from "../socket"; 

function toLocalInputValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const s = value.trim();

    const withT = s.includes("T") ? s : s.replace(" ", "T");

    return withT.slice(0, 16);
  }

  const d = new Date(value);
  const iso = d.toISOString();
  return iso.slice(0, 16);
}

export default function CalendarPage() {
  const { theme } = useContext(ThemeContext);

  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open_settings", handler);
    return () => window.removeEventListener("open_settings", handler);
  }, []);

  const [managerOpen, setManagerOpen] = useState(false);

  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayCache, setHolidayCache] = useState({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editEvent, setEditEvent] = useState(null);

  const [previewEvent, setPreviewEvent] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

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

  useEffect(() => {
    if (!selectedCalendar) return;

    console.log("📡 joining calendar socket room:", selectedCalendar);
    socket.emit("join_calendar", selectedCalendar);

    return () => {
      console.log("📡 leaving calendar socket room:", selectedCalendar);
      socket.emit("leave_calendar", selectedCalendar);
    };
  }, [selectedCalendar]);

useEffect(() => {
  if (!previewEvent) return;

  const cal = calendars.find(
    c => c._id?.toString() === previewEvent.calendar?.toString()
  );

  if (cal) {
    setPreviewEvent(prev => ({ ...prev, calendarObj: cal }));
  }
}, [calendars]);


  useEffect(() => {
  const handler = (e) => {
    setEvents(e.detail);   
  };

  window.addEventListener("events_updated", handler);
  return () => window.removeEventListener("events_updated", handler);
}, []);

  useEffect(() => {
    function handleRealtimeUpdate(data) {
      console.log("🔥 REALTIME EVENT:", data);


      if (data.type === "created") {
        setEvents((prev) => [...prev, data.event]);
      }
      if (data.type === "updated") {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === data.event._id ? data.event : ev))
        );

        setPreviewEvent((prev) =>
          prev && prev._id === data.event._id ? data.event : prev
        );
      }

      if (data.type === "deleted") {
        setEvents((prev) => prev.filter((ev) => ev._id !== data.eventId));

        setPreviewEvent((prev) =>
          prev && prev._id === data.eventId ? null : prev
        );
      }
    }

    socket.on("calendar_update", handleRealtimeUpdate);

    return () => {
      socket.off("calendar_update", handleRealtimeUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [calRes, evRes] = await Promise.allSettled([
          fetch(`${BASE_URL}/api/calendars`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/events`, {
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
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);
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

    if (
      cal.owner?._id?.toString() === currentUserId ||
      cal.owner?.toString() === currentUserId
    ) {
      setUserRole("owner");
      return;
    }

    if ((cal.editors || []).some((u) => (u._id || u).toString() === currentUserId)) {
      setUserRole("editor");
      return;
    }

    if ((cal.members || []).some((u) => (u._id || u).toString() === currentUserId)) {
      setUserRole("member");
      return;
    }

    setUserRole("member");
  }, [selectedCalendar, calendars, currentUserId]);

  const canCreateEvents = userRole === "owner" || userRole === "editor";
  const canEditEvents = canCreateEvents;
  useEffect(() => {
    if (!token) return;

    const year = currentDate.getFullYear();

    if (holidayCache[year]) {
      setHolidays(holidayCache[year]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/events/holidays?year=${year}`,
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
        }));

        if (!cancelled) {
          setHolidayCache((prev) => ({ ...prev, [year]: mapped }));
          setHolidays(mapped);
        }
      } catch {
        if (!cancelled) setHolidays([]);
      }
    };

    load();
    return () => (cancelled = true);
  }, [currentDate, token, holidayCache]);

  const selectedCalObj = calendars.find((c) => c._id === selectedCalendar);
  const allEvents = selectedCalObj?.isHolidayCalendar ? holidays : events;
  const filteredEvents = allEvents.filter((e) => {
    if (selectedCalObj?.isHolidayCalendar) {
      return e.category === "holiday";
    }

    const matchCal =
      !e.calendar ||
      (typeof e.calendar === "string"
        ? e.calendar === selectedCalendar
        : e.calendar._id?.toString() === selectedCalendar);

    const matchSearch = e.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter ? e.category === categoryFilter : true;

    return matchCal && matchSearch && matchCat;
  });

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!canCreateEvents) return alert("У вас немає прав");

    const url =
      modalMode === "edit"
        ? `${BASE_URL}/api/events/${editEvent._id}`
        : `${BASE_URL}/api/events`;

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

    if (!res.ok) return alert(data.error || "Помилка");

    closeModal();
  };

  const handleDeleteEvent = async (id) => {
    if (!canEditEvents) return alert("У вас немає прав");
    if (!window.confirm("Видалити подію?")) return;

    const res = await fetch(`${BASE_URL}/api/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Помилка");

    closeModal();
  };
  const openModal = useCallback(
    (mode = "add", event = null) => {
      if (mode === "add" && !canCreateEvents) return;
      if (mode === "edit" && !canEditEvents) return;

      setModalMode(mode);

      if (mode === "edit" && event) {
        setEditEvent(event);

        const start = event.start
          ? toLocalInputValue(event.start)
          : event.date
          ? toLocalInputValue(event.date)
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
          date: event?.start ? toLocalInputValue(event.start) : "",
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

  const handleEventClick = useCallback((event) => {
    setPreviewEvent(event);
  }, []);

  const handleInvite = async () => {
    if (!previewEvent || !inviteEmail.trim()) return;

    setInviteLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/api/events/${previewEvent._id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: inviteEmail.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка запрошення");

      setInviteEmail("");
    } catch (err) {
      alert(err.message);
    }

    setInviteLoading(false);
  };
  const handleRemoveInviteUser = async (value, type) => {
    if (!previewEvent) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/events/${previewEvent._id}/remove-invite`,
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
      if (!res.ok) return alert(data.error || "Помилка");
    } catch {
      alert("Помилка видалення користувача");
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.pageBg,
          color: theme.text,
          fontSize: 22,
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Завантаження...
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ background: theme.pageBg, minHeight: "100vh" }}
    >
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <CalendarManager
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
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
          canCreateEvents={canCreateEvents}
          onOpenManager={() => setManagerOpen(true)}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={String(currentView) + String(currentDate)}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            {currentView === "year" ? (
              <YearView
                year={currentDate.getFullYear()}
                events={filteredEvents}
                onSelectDate={(d) => {
                  setCurrentDate(new Date(d));
                  setCurrentView("month");
                }}
              />
            ) : (
              <CalendarView
                events={filteredEvents}
                calendars={calendars}
                selectedCalendar={selectedCalendar}
                currentView={currentView}
                setCurrentView={setCurrentView}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onEventClick={handleEventClick}
                openModal={openModal}
                colorByCategory={colorByCategory}
                canCreateEvents={canCreateEvents}
                canEditEvents={canEditEvents}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
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
        )}

        {previewEvent && (
          <EventPreview
            event={previewEvent}
            onClose={() => setPreviewEvent(null)}
            onEdit={() => {
              const isCreator =
                previewEvent?.creator?._id?.toString() ===
                  currentUserId?.toString() ||
                previewEvent?.creator?.toString() === currentUserId?.toString();

              if (canEditEvents || isCreator) openModal("edit", previewEvent);
            }}
            onDelete={() => {
              const isCreator =
                previewEvent?.creator?._id?.toString() ===
                  currentUserId?.toString() ||
                previewEvent?.creator?.toString() === currentUserId?.toString();

              if (canEditEvents || isCreator)
                handleDeleteEvent(previewEvent._id);
            }}
            onDeleteSelf={() => handleDeleteEvent(previewEvent._id)}
            onInvite={handleInvite}
            onRemoveInviteUser={handleRemoveInviteUser}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteLoading={inviteLoading}
            canManage={canEditEvents}
            currentUserId={currentUserId}
            currentUserEmail={currentUser?.email}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
