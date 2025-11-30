// src/components/calendar/CalendarView.jsx

import React, { useContext, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ThemeContext } from "../context/ThemeContext";

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

export default function CalendarView({
  events,
  calendars,
  selectedCalendar,
  currentView,
  setCurrentView,
  currentDate,
  setCurrentDate,
  setPreviewEvent,
  openModal,
  colorByCategory,

  // 🔥 ПРАВА ДОСТУПА
  canCreateEvents = true,
  canEditEvents = true,
}) {
  const { theme } = useContext(ThemeContext);

  // ===============================
  //   МЭППИНГ СОБЫТИЙ
  // ===============================
  const mappedEvents = useMemo(
    () =>
      events.map((e) => {
        const calendar = calendars.find(
          (c) => c._id?.toString() === e.calendar?.toString()
        );

        const start = e.start
          ? new Date(e.start)
          : e.date
          ? new Date(e.date)
          : new Date();

        const end = e.end
          ? new Date(e.end)
          : addMinutes(start, e.duration || 60);

        const isAllDay = e.allDay === true || e.category === "holiday";

        return {
          ...e,
          start,
          end,
          allDay: isAllDay,
          color:
            e.color ||
            calendar?.color ||
            colorByCategory[e.category] ||
            theme.primary,
        };
      }),
    [events, calendars, colorByCategory, theme.primary]
  );

  // ===============================
  //   СТИЛИ ДЛЯ КАЛЕНДАРЯ
  // ===============================
  const calendarStyles = `
    .rbc-off-range-bg,
    .rbc-today,
    .rbc-month-row,
    .rbc-day-bg,
    .rbc-month-view,
    .rbc-time-view,
    .rbc-agenda-view,
    .rbc-row-bg {
        background: ${
          theme.name === "light"
            ? "#ffffff"
            : "rgba(15,23,42,0.5)"
        } !important;
    }

    .rbc-date-cell {
        color: ${
          theme.name === "light" ? "#0f172a" : "#ffffff"
        } !important;
        font-weight: 500;
    }

    .rbc-today {
        background: ${
          theme.name === "light"
            ? "rgba(37,99,235,0.1)"
            : "rgba(96,165,250,0.15)"
        } !important;
    }
  `;

  // ===============================
  //   РЕНДЕР КОМПОНЕНТА
  // ===============================
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: theme.cardBorder,
        boxShadow: theme.cardShadow,
        background:
          theme.name === "glass"
            ? "rgba(15,23,42,0.88)"
            : theme.cardBg,
        backdropFilter: `blur(${theme.blur})`,
      }}
    >
      <style>{calendarStyles}</style>

      <Calendar
        localizer={localizer}
        selectable={canCreateEvents} // viewer не может выделять слот
        events={mappedEvents}
        startAccessor="start"
        endAccessor="end"
        view={currentView}
        date={currentDate}
        onView={setCurrentView}
        onNavigate={setCurrentDate}
        views={["month", "week", "day", "agenda"]}
        popup
        style={{ height: 620, padding: 10 }}

        // ============================
        //   Создание события
        // ============================
        onSelectSlot={
          canCreateEvents
            ? (slot) => openModal("add", { start: slot.start })
            : undefined
        }

        // ============================
        //   Нажатие на событие
        // ============================
        onSelectEvent={(event) => {
          // holiday → всегда read-only
          if (event.category === "holiday") {
            setPreviewEvent(event);
            return;
          }

          // member → только preview
          if (!canEditEvents) {
            setPreviewEvent(event);
            return;
          }

          // owner/editor → редактирование
          openModal("edit", event);
        }}

        // ============================
        //   Стили самих событий
        // ============================
        eventPropGetter={(event) => ({
          style: {
            background:
              event.category === "holiday"
                ? theme.dangerSoft
                : event.color,
            borderRadius: 10,
            color:
              event.category === "holiday"
                ? theme.danger
                : "#ffffff",
            border:
              event.category === "holiday"
                ? `1px solid ${theme.danger}`
                : "none",
            padding: 4,
            paddingLeft: 8,
            paddingRight: 8,
            boxShadow:
              theme.name === "glass"
                ? "0 10px 26px rgba(15,23,42,0.6)"
                : "0 4px 12px rgba(15,23,42,0.25)",
          },
        })}
      />
    </div>
  );
}
