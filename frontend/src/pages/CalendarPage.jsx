// =======================
//   CalendarPage.jsx — BEAUTIFUL ANIMATED + YEAR VIEW
// =======================

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


// ===============================
// Convert date → HTML datetime-local
// ===============================
function toLocalInputValue(date) {
  if (!date) return "";
  const d = new Date(date);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}


export default function CalendarPage() {
  const { theme } = useContext(ThemeContext);

  // SETTINGS MODAL
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open_settings", handler);
    return () => window.removeEventListener("open_settings", handler);
  }, []);

  // CALENDAR MANAGER
  const [managerOpen, setManagerOpen] = useState(false);

  // DATA
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayCache, setHolidayCache] = useState({});
  const [loading, setLoading] = useState(true);

  // EVENT MODAL
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editEvent, setEditEvent] = useState(null);

  // PREVIEW
  const [previewEvent, setPreviewEvent] = useState(null);

  // FILTERS
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // DATE / VIEW
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // INVITES
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // USER
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;
  const currentUserEmail = currentUser?.email;

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


  // ===========================
  // LOAD CALENDARS + EVENTS
  // ===========================
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


  // ===========================
  // USER ROLE
  // ===========================
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



  // ===========================
  // LOAD HOLIDAYS
  // ===========================
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



  // ===========================
  // EVENTS MERGE
  // ===========================
  const selectedCalObj = calendars.find((c) => c._id === selectedCalendar);
  const allEvents = selectedCalObj?.isHolidayCalendar ? holidays : events;



  // ===========================
  // FILTER EVENTS
  // ===========================
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



  // ===========================
  // SAVE EVENT
  // ===========================
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

    if (modalMode === "edit") {
      setEvents((prev) => prev.map((ev) => (ev._id === data._id ? data : ev)));
    } else {
      setEvents((prev) => [...prev, data]);
    }

    closeModal();
  };



  // ===========================
  // DELETE EVENT
  // ===========================
  const handleDeleteEvent = async (id) => {
    if (!canEditEvents) return alert("У вас немає прав");
    if (!window.confirm("Видалити подію?")) return;

    const res = await fetch(`${BASE_URL}/api/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Помилка");

    setEvents((prev) => prev.filter((e) => e._id !== id));
    setPreviewEvent(null);
    closeModal();
  };



  // ===========================
  // OPEN MODAL
  // ===========================
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



  // ===========================
  // EVENT PREVIEW
  // ===========================
  const handleEventClick = useCallback((event) => {
    setPreviewEvent(event);
  }, []);



  // ===========================
  // INVITE USER
  // ===========================
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

      const updated = data.event || data;

      setEvents((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );

      setPreviewEvent(updated);
      setInviteEmail("");
    } catch (err) {
      alert(err.message);
    }

    setInviteLoading(false);
  };



  // ===========================
  // REMOVE INVITED USER
  // ===========================
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

      setEvents((prev) =>
        prev.map((e) => (e._id === data.event._id ? data.event : e))
      );

      setPreviewEvent(data.event);
    } catch {
      alert("Помилка видалення користувача");
    }
  };



  // ===========================
  // LOADING SCREEN
  // ===========================
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



  // ===========================
  // RENDER
  // ===========================
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
            onEdit={() =>
              (canEditEvents ||
                previewEvent?.creator?.toString() ===
                  currentUserId?.toString()) &&
              openModal("edit", previewEvent)
            }
            onDelete={() =>
              (canEditEvents ||
                previewEvent?.creator?.toString() ===
                  currentUserId?.toString()) &&
              handleDeleteEvent(previewEvent._id)
            }
            onDeleteSelf={() =>
              previewEvent && handleDeleteEvent(previewEvent._id)
            }
            onInvite={handleInvite}
            onRemoveInviteUser={handleRemoveInviteUser}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteLoading={inviteLoading}
            canManage={
              canEditEvents ||
              previewEvent?.creator?.toString() === currentUserId?.toString()
            }
            currentUserId={currentUserId}
            currentUserEmail={currentUserEmail}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
