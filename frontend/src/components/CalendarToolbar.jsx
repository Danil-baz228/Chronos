import React, { useContext } from "react";
import { getISOWeek } from "date-fns";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";

function formatHolidayName(name) {
  if (!name) return "";
  const lower = name.toLowerCase();
  if (!lower.includes("holiday")) return name;

  const regionMatch = name.match(/\((.*?)\)/);
  const region = regionMatch ? regionMatch[1] : "";
  return region ? `Holidays (${region})` : "Holidays";
}

export default function CalendarToolbar({
  calendars,
  selectedCalendar,
  setSelectedCalendar,

  searchQuery,
  setSearchQuery,

  categoryFilter,
  setCategoryFilter,

  currentView,
  setCurrentView,

  currentDate,

  onNewEventClick,
  canCreateEvents = true,

  onOpenManager,
}) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: theme.text,
            }}
          >
            {t("calendar.title")}
          </h2>

          {currentView === "week" && (
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: theme.textMuted,
              }}
            >
              {t("calendar.weekLabel")}: {getISOWeek(currentDate)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onOpenManager}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              background:
                theme.name === "glass"
                  ? "rgba(15,23,42,0.8)"
                  : "rgba(15,23,42,0.03)",
              color: theme.text,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span>🗂</span>
            <span>Управління календарями</span>
          </button>

          {canCreateEvents && (
            <button
              onClick={onNewEventClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: `radial-gradient(circle at 0 0, ${theme.primary}, ${theme.primarySoft})`,
                color: theme.text,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: theme.cardShadow,
              }}
            >
              <span style={{ fontSize: 20 }}>＋</span>
              {t("toolbar.newEvent")}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 14,
          background:
            theme.name === "glass" ? "rgba(15,23,42,0.85)" : theme.cardBg,
          border: theme.cardBorder,
          boxShadow: theme.cardShadow,
          backdropFilter: `blur(${theme.blur})`,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <select
            value={selectedCalendar || ""}
            onChange={(e) => setSelectedCalendar(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              background: theme.inputBg,
              color: theme.text,
              fontSize: 13,
            }}
          >
            {calendars.map((c) => (
              <option key={c._id} value={c._id}>
                {formatHolidayName(c.name)}
              </option>
            ))}
          </select>

          <input
            placeholder={`🔍 ${t("toolbar.search")}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              background: theme.inputBg,
              color: theme.text,
              fontSize: 13,
              minWidth: 180,
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              background: theme.inputBg,
              color: theme.text,
              fontSize: 13,
            }}
          >
            <option value="">{t("toolbar.allCategories")}</option>
            <option value="arrangement">{t("category.arrangement")}</option>
            <option value="reminder">{t("category.reminder")}</option>
            <option value="task">{t("category.task")}</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 3,
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.55)",
            background:
              theme.name === "glass"
                ? "rgba(15,23,42,0.9)"
                : "rgba(148,163,184,0.12)",
          }}
        >
          {[
            { key: "month", label: "M" },
            { key: "week", label: "W" },
            { key: "day", label: "D" },
            { key: "agenda", label: "A" },
            { key: "year", label: "Y" },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setCurrentView(v.key)}
              style={{
                padding: "5px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                color:
                  currentView === v.key ? theme.text : theme.textMuted,
                background:
                  currentView === v.key
                    ? theme.primarySoft
                    : "transparent",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
