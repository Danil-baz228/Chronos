import React, { useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function CalendarManager({ calendars, setCalendars, token }) {
  const { theme } = useContext(ThemeContext);

  const [showModal, setShowModal] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [form, setForm] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
  });

  const [hiddenCalendars, setHiddenCalendars] = useState([]);
  const [showHiddenList, setShowHiddenList] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCalendar, setInviteCalendar] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
  });
  const [inviteResult, setInviteResult] = useState(null);

  const isMainCalendar = (c) =>
    c.isMain || c.name === "Main Calendar";

  // modal open / close
  const openModal = (calendar = null) => {
    if (calendar) {
      if (isMainCalendar(calendar)) {
        alert("Главный календарь нельзя редактировать");
        return;
      }
      setEditingCalendar(calendar);
      setForm({
        name: calendar.name,
        color: calendar.color,
        description: calendar.description,
      });
    } else {
      setEditingCalendar(null);
      setForm({ name: "", color: "#3b82f6", description: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCalendar(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingCalendar
      ? `http://localhost:5000/api/calendars/${editingCalendar._id}`
      : `http://localhost:5000/api/calendars`;

    const res = await fetch(url, {
      method: editingCalendar ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    if (editingCalendar) {
      setCalendars((prev) =>
        prev.map((c) => (c._id === data._id ? data : c))
      );
    } else {
      setCalendars((prev) => [...prev, data]);
    }

    closeModal();
  };

  // Удалить календарь
  const handleDelete = async (calendar) => {
    if (isMainCalendar(calendar)) return alert("Главный календарь нельзя удалить");

    if (!window.confirm("Удалить календарь?")) return;

    const res = await fetch(
      `http://localhost:5000/api/calendars/${calendar._id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
  };

  // hide calendar
  const hideCalendar = async (calendar) => {
    if (isMainCalendar(calendar)) return alert("Главный календарь нельзя скрыть");

    const res = await fetch(
      `http://localhost:5000/api/calendars/${calendar._id}/hide`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
    setHiddenCalendars((prev) => [...prev, data]);
  };

  // show calendar back
  const showCalendarBack = async (calendar) => {
    const res = await fetch(
      `http://localhost:5000/api/calendars/${calendar._id}/show`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    setHiddenCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
    setCalendars((prev) => [...prev, data]);
  };

  // invite modal
  const openInviteModal = (calendar) => {
    setInviteCalendar(calendar);
    setInviteForm({ email: "", role: "member" });
    setInviteResult(null);
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteCalendar(null);
    setInviteResult(null);
  };

  // invite submit
  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `http://localhost:5000/api/calendars/${inviteCalendar._id}/invite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    if (data.calendar && data.calendar._id) {
      setCalendars((prev) =>
        prev.map((c) => (c._id === data.calendar._id ? data.calendar : c))
      );
    }

    setInviteResult({
      message: data.message,
      previewUrl: data.emailPreview,
    });
  };


  return (
    <div>
      <button style={button(theme)} onClick={() => setShowModal(true)}>
        🗂 Управление календарями
      </button>

      <button style={hiddenBtn(theme)} onClick={() => setShowHiddenList(!showHiddenList)}>
        👁 Скрытые календари ({hiddenCalendars.length})
      </button>

      {showHiddenList && (
        <div style={hiddenBox(theme)}>
          {hiddenCalendars.length === 0 ? (
            <p style={{ margin: 0 }}>Нет скрытых календарей</p>
          ) : (
            hiddenCalendars.map((c) => (
              <div key={c._id} style={hiddenItem(theme)}>
                <span><b>{c.name}</b></span>
                <button onClick={() => showCalendarBack(c)} style={restoreBtn(theme)}>
                  ♻ Показать
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Основная модалка */}
      {showModal && (
        <div style={overlay(theme)} onClick={closeModal}>
          <div style={modal(theme)} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              {editingCalendar ? "✏️ Редактировать календарь" : "➕ Новый календарь"}
            </h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                placeholder="Название"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={input(theme)}
              />

              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 50, height: 40, borderRadius: 8, border: "none" }}
              />

              <textarea
                placeholder="Описание"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={textarea(theme)}
              />

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button style={saveBtn(theme)}>💾 Сохранить</button>

                {editingCalendar && !isMainCalendar(editingCalendar) && (
                  <button type="button" style={deleteBtn(theme)} onClick={() => handleDelete(editingCalendar)}>
                    🗑 Удалить
                  </button>
                )}

                <button type="button" style={cancelBtn(theme)} onClick={closeModal}>
                  Отмена
                </button>
              </div>
            </form>

            <h4>📅 Ваши календари</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {calendars.map((c) => (
                <li key={c._id} style={listItem(theme)}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        background: c.color,
                        borderRadius: "50%",
                      }}
                    ></div>
                    <b>{c.name}{isMainCalendar(c) ? " ⭐" : ""}</b>
                  </div>

                  {!isMainCalendar(c) && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={smallBtn(theme)} onClick={() => openModal(c)}>✏</button>
                      <button style={hideBtn(theme)} onClick={() => hideCalendar(c)}>🙈</button>
                      <button style={inviteBtn(theme)} onClick={() => openInviteModal(c)}>📨</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Модалка приглашения */}
      {showInviteModal && inviteCalendar && (
        <div style={overlay(theme)} onClick={closeInviteModal}>
          <div style={modal(theme)} onClick={(e) => e.stopPropagation()}>
            <h3>📨 Пригласить в "{inviteCalendar.name}"</h3>

            <form onSubmit={handleInviteSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="Email пользователя"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
                style={input(theme)}
              />

              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                style={input(theme)}
              >
                <option value="member">Участник (только просмотр)</option>
                <option value="editor">Редактор (может менять события)</option>
              </select>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button style={saveBtn(theme)} type="submit">Отправить</button>
                <button style={cancelBtn(theme)} type="button" onClick={closeInviteModal}>Закрыть</button>
              </div>
            </form>

            {inviteResult && (
              <div style={{ marginTop: 12, fontSize: 14 }}>
                <p>{inviteResult.message}</p>
                {inviteResult.previewUrl && (
                  <a href={inviteResult.previewUrl} target="_blank" rel="noreferrer">
                    🔗 Предпросмотр письма
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const overlay = (theme) => ({
  position: "fixed",
  inset: 0,
  backdropFilter: `blur(${theme.blur})`,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
});

const modal = (theme) => ({
  width: 420,
  borderRadius: 16,
  padding: 25,
  background: theme.cardBg,
  border: theme.cardBorder,
  boxShadow: theme.cardShadow,
  color: theme.text,
});

const button = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  marginRight: 10,
});

const hiddenBtn = (theme) => ({
  background: theme.textMuted,
  color: theme.name === "dark" ? "#fff" : "#000",
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
});

const hiddenBox = (theme) => ({
  marginTop: 10,
  padding: 12,
  background: theme.primarySoft,
  border: theme.cardBorder,
  borderRadius: 10,
});

const hiddenItem = (theme) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: 6,
  borderBottom: theme.cardBorder,
});

const restoreBtn = (theme) => ({
  background: "#22c55e",
  color: "white",
  padding: "4px 8px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
});

const input = (theme) => ({
  padding: "8px 12px",
  borderRadius: 8,
  background: theme.inputBg,
  border: theme.cardBorder,
  color: theme.text,
});

const textarea = input;

const saveBtn = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
});

const deleteBtn = () => ({
  background: "#ef4444",
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
});

const cancelBtn = (theme) => ({
  background: theme.primarySoft,
  color: theme.text,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
});

const listItem = (theme) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: theme.cardBorder,
});

const smallBtn = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
});

const hideBtn = () => ({
  background: "#eab308",
  color: "white",
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
});

const inviteBtn = () => ({
  background: "#0ea5e9",
  color: "white",
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
});
