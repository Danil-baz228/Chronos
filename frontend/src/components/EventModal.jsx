// ===============================
// EventModal.jsx — FIXED TIMEZONE
// ===============================

import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";

// 🔥 Конвертация UTC → local для datetime-local input
function toLocalInput(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  const pad = (n) => String(n).padStart(2, "0");

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function EventModal({
  isOpen,
  mode,
  newEvent,
  setNewEvent,
  onClose,
  onSave,
  onDelete,
  editEvent,
  canEditEvents = true,
}) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const readOnly = !canEditEvents || newEvent.category === "holiday";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(14px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.cardBg,
          borderRadius: 18,
          width: 420,
          padding: 24,
          boxShadow: theme.cardShadow,
          border: theme.cardBorder,
          backdropFilter: `blur(${theme.blur})`,
          color: theme.text,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {mode === "edit" ? t("modal.editTitle") : t("modal.addTitle")}
        </h3>

        <form
          onSubmit={readOnly ? (e) => e.preventDefault() : onSave}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* TITLE */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.name")}</span>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              disabled={readOnly}
              required
              style={inputStyle(theme)}
            />
          </label>

          {/* DATE FIXED */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.datetime")}</span>
            <input
              type="datetime-local"
              value={toLocalInput(newEvent.date)}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  date: e.target.value, // сохраняем как есть, backend добавит Z
                }))
              }
              disabled={readOnly}
              required
              style={inputStyle(theme)}
            />
          </label>

          {/* DURATION */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.duration")}</span>
            <input
              type="number"
              value={newEvent.duration}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  duration: Number(e.target.value),
                }))
              }
              disabled={readOnly}
              required
              style={inputStyle(theme)}
            />
          </label>

          {/* CATEGORY */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.category")}</span>
            <select
              value={newEvent.category}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              disabled={readOnly}
              style={inputStyle(theme)}
            >
              <option value="arrangement">{t("category.arrangement")}</option>
              <option value="reminder">{t("category.reminder")}</option>
              <option value="task">{t("category.task")}</option>
            </select>
          </label>

          {/* COLOR */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.color")}</span>
            <input
              type="color"
              value={newEvent.color || "#3b82f6"}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
              disabled={readOnly}
              style={{
                ...inputStyle(theme),
                padding: 0,
                height: 32,
                cursor: readOnly ? "not-allowed" : "pointer",
              }}
            />
          </label>

          {/* DESCRIPTION */}
          <label style={labelStyle(theme)}>
            <span>{t("modal.description")}</span>
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                !readOnly &&
                setNewEvent((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={readOnly}
              rows={3}
              style={{
                ...inputStyle(theme),
                resize: "vertical",
              }}
            />
          </label>

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              gap: 8,
            }}
          >
            {!readOnly && (
              <button
                type="submit"
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 14px",
                  background: theme.primary,
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("modal.save")}
              </button>
            )}

            {!readOnly && mode === "edit" && editEvent && (
              <button
                type="button"
                onClick={() => onDelete(editEvent._id)}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 14px",
                  background: theme.danger,
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("modal.delete")}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.7)",
                padding: "8px 14px",
                background: "transparent",
                color: theme.text,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("modal.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = (theme) => ({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  color: theme.textMuted,
});

const inputStyle = (theme) => ({
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  padding: "7px 12px",
  background: theme.inputBg,
  color: theme.text,
  fontSize: 13,
  outline: "none",
});
