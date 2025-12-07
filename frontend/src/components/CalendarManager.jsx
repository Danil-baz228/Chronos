// src/components/CalendarManager.jsx

import React, { useState, useContext, useMemo, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { socket } from "../socket";

export default function CalendarManager({
  isOpen,
  onClose,
  calendars,
  setCalendars,
  token,
}) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const currentUserId = user?._id;

  const [editingCalendar, setEditingCalendar] = useState(null);
  const [form, setForm] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
  });

  const [hiddenCalendars, setHiddenCalendars] = useState([]);

  // === MEMBERS MODAL ===
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersCalendar, setMembersCalendar] = useState(null);

  // === INVITE FORM (перенесено в MembersModal) ===
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
  });
  const [inviteResult, setInviteResult] = useState(null);

  const isMainCalendar = (c) => c?.isMain || c?.name === "Main Calendar";
  const isHolidayCalendar = (c) => c?.isHolidayCalendar === true;

  const isOwner = (calendar) => {
    if (!calendar || !currentUserId) return false;
    const ownerId = calendar.owner?._id || calendar.owner;
    return ownerId?.toString() === currentUserId.toString();
  };

  const isParticipant = (calendar) => {
    if (!calendar || !currentUserId) return false;
    const uid = currentUserId.toString();

    if (isOwner(calendar)) return true;
    if ((calendar.editors || []).some((e) => (e._id || e).toString() === uid))
      return true;
    if ((calendar.members || []).some((m) => (m._id || m).toString() === uid))
      return true;

    return false;
  };

  const myRoleInMembersCalendar = useMemo(() => {
    if (!membersCalendar || !currentUserId) return "member";

    if (isOwner(membersCalendar)) return "owner";

    const uid = currentUserId.toString();
    if (
      (membersCalendar.editors || []).some(
        (e) => (e._id || e).toString() === uid
      )
    )
      return "editor";

    return "member";
  }, [membersCalendar, currentUserId]);

  // ===============================
  // 🔥 REALTIME – обновление календарей
  // ===============================
  useEffect(() => {
    if (!socket) return;

    const handler = ({ calendar }) => {
      // Обновляем список календарей
      setCalendars((prev) => {
        const exists = prev.some((c) => c._id === calendar._id);
        if (exists) {
          return prev.map((c) => (c._id === calendar._id ? calendar : c));
        }
        return [...prev, calendar];
      });

      // Если открыт MembersModal по этому календарю — тоже обновляем
      setMembersCalendar((prev) =>
        prev && prev._id === calendar._id ? calendar : prev
      );
    };

    socket.on("calendar_members_update", handler);
    return () => socket.off("calendar_members_update", handler);
  }, [setCalendars, setMembersCalendar]);

  // =====================================================================
  // CREATE / EDIT CALENDAR
  // =====================================================================

  const openModalForEdit = (calendar) => {
    if (isMainCalendar(calendar))
      return alert("Головний календар не можна редагувати");
    if (isHolidayCalendar(calendar))
      return alert("Календар свят не можна редагувати");
    if (!isOwner(calendar))
      return alert("Лише власник може редагувати календар");

    setEditingCalendar(calendar);
    setForm({
      name: calendar.name,
      color: calendar.color,
      description: calendar.description || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingCalendar
      ? `${BASE_URL}/api/calendars/${editingCalendar._id}`
      : `${BASE_URL}/api/calendars`;

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
    } else setCalendars((prev) => [...prev, data]);

    setEditingCalendar(null);
    setForm({ name: "", color: "#3b82f6", description: "" });
  };

  const handleDelete = async (calendar) => {
    if (isMainCalendar(calendar))
      return alert("Головний календар не можна видалити");
    if (isHolidayCalendar(calendar))
      return alert("Календар свят не можна видалити");
    if (!isOwner(calendar))
      return alert("Лише власник може видалити календар");

    if (!window.confirm("Видалити календар?")) return;

    const res = await fetch(`${BASE_URL}/api/calendars/${calendar._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
  };

  // =====================================================================
  // HIDE / SHOW CALENDAR
  // =====================================================================

  const hideCalendar = async (calendar) => {
    if (isMainCalendar(calendar))
      return alert("Головний календар не можна приховати");
    if (!isOwner(calendar))
      return alert("Лише власник може приховати календар");

    const res = await fetch(`${BASE_URL}/api/calendars/${calendar._id}/hide`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
    setHiddenCalendars((prev) => [...prev, data]);
  };

  const showCalendarBack = async (calendar) => {
    const res = await fetch(`${BASE_URL}/api/calendars/${calendar._id}/show`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    setHiddenCalendars((prev) => prev.filter((c) => c._id !== calendar._id));
    setCalendars((prev) => [...prev, data]);
  };

  // =====================================================================
  // MEMBERS MODAL
  // =====================================================================

  const openMembersModal = (calendar) => {
    if (!isParticipant(calendar))
      return alert("У вас немає доступу до учасників");

    if (isMainCalendar(calendar))
      return alert("Головний календар не має учасників");

    if (isHolidayCalendar(calendar))
      return alert("Календар свят не має учасників");

    setMembersCalendar(calendar);
    setInviteResult(null);
    setInviteForm({ email: "", role: "member" });
    setShowMembersModal(true);
  };

  const closeMembersModal = () => {
    setMembersCalendar(null);
    setShowMembersModal(false);
  };

  const handleInviteSubmitFromMembers = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `${BASE_URL}/api/calendars/${membersCalendar._id}/invite`,
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

    if (data.calendar) {
      setCalendars((prev) =>
        prev.map((c) => (c._id === data.calendar._id ? data.calendar : c))
      );
      setMembersCalendar(data.calendar);
    }

    setInviteResult({ message: data.message });
    setInviteForm({ email: "", role: "member" });
  };

  const updateMemberRole = async (userId, role) => {
    if (myRoleInMembersCalendar !== "owner") return;

    const res = await fetch(
      `${BASE_URL}/api/calendars/${membersCalendar._id}/members/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) =>
      prev.map((c) => (c._id === data.calendar._id ? data.calendar : c))
    );

    setMembersCalendar(data.calendar);
  };

  const removeMember = async (userId) => {
    const isSelf =
      currentUserId && userId?.toString() === currentUserId.toString();

    if (myRoleInMembersCalendar !== "owner" && !isSelf) return;

    const res = await fetch(
      `${BASE_URL}/api/calendars/${membersCalendar._id}/members/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await res.json();
    if (data.error) return alert(data.error);

    setCalendars((prev) =>
      prev.map((c) => (c._id === data.calendar._id ? data.calendar : c))
    );

    if (isSelf) closeMembersModal();
    else setMembersCalendar(data.calendar);
  };

  // =====================================================================
  // RENDER
  // =====================================================================

  if (!isOpen) return null;

  return (
    <>
      {/* MAIN MODAL */}
      <div style={overlay(theme)} onClick={onClose}>
        <div style={modal(theme)} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ marginTop: 0 }}>🗂 Управління календарями</h3>

          {/* Форма створення/редагування */}
          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <input
              placeholder="Назва"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={input(theme)}
            />

            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              style={{
                width: 50,
                height: 40,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            />

            <textarea
              placeholder="Опис"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={textarea(theme)}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <button style={saveBtn(theme)} type="submit">
                💾 Зберегти
              </button>

              {editingCalendar &&
                isOwner(editingCalendar) &&
                !isMainCalendar(editingCalendar) &&
                !isHolidayCalendar(editingCalendar) && (
                  <button
                    type="button"
                    style={deleteBtn(theme)}
                    onClick={() => handleDelete(editingCalendar)}
                  >
                    🗑 Видалити
                  </button>
                )}

              <button
                type="button"
                style={cancelBtn(theme)}
                onClick={() => {
                  setEditingCalendar(null);
                  setForm({
                    name: "",
                    color: "#3b82f6",
                    description: "",
                  });
                }}
              >
                Очистити
              </button>
            </div>
          </form>

          {/* Список календарів */}
          <h4 style={{ marginTop: 0 }}>📅 Ваші календарі</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {calendars.map((c) => {
              const ownerHere = isOwner(c);
              const participantHere = isParticipant(c);

              return (
                <li key={c._id} style={listItem(theme)}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        background: c.color,
                        borderRadius: "50%",
                      }}
                    />
                    <b>
                      {c.name}
                      {isMainCalendar(c) ? " ⭐" : ""}
                      {isHolidayCalendar(c) ? " 🎉" : ""}
                    </b>
                  </div>

                  {/* Кнопки управления */}
                  {isMainCalendar(c) ? null : (
                    <div style={{ display: "flex", gap: 6 }}>
                      {/* ==== HOLIDAY CALENDAR ==== */}
                      {isHolidayCalendar(c) ? (
                        <>
                          {ownerHere && (
                            <button
                              style={hideBtn(theme)}
                              onClick={() => hideCalendar(c)}
                            >
                              🙈
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {ownerHere && (
                            <>
                              <button
                                style={smallBtn(theme)}
                                onClick={() => openModalForEdit(c)}
                              >
                                ✏
                              </button>

                              <button
                                style={hideBtn(theme)}
                                onClick={() => hideCalendar(c)}
                              >
                                🙈
                              </button>
                            </>
                          )}

                          {participantHere && (
                            <button
                              style={membersBtn(theme)}
                              onClick={() => openMembersModal(c)}
                            >
                              👥
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Приховані */}
          <h4 style={{ marginTop: 18 }}>👁 Приховані календарі</h4>
          {hiddenCalendars.length === 0 ? (
            <p style={{ fontSize: 14 }}>Немає прихованих календарів</p>
          ) : (
            hiddenCalendars.map((c) => (
              <div key={c._id} style={hiddenItem(theme)}>
                <b>{c.name}</b>
                <button
                  style={restoreBtn(theme)}
                  onClick={() => showCalendarBack(c)}
                >
                  ♻ Показати
                </button>
              </div>
            ))
          )}

          <div style={{ marginTop: 20, textAlign: "right" }}>
            <button
              type="button"
              style={cancelBtn(theme)}
              onClick={onClose}
            >
              Закрити
            </button>
          </div>
        </div>
      </div>

      {/* MEMBERS MODAL */}
      {showMembersModal && membersCalendar && (
        <div style={overlay(theme)} onClick={closeMembersModal}>
          <div style={modal(theme)} onClick={(e) => e.stopPropagation()}>
            <h3>👥 Учасники "{membersCalendar.name}"</h3>

            {/* === Новий учасник === */}
            <div style={{ marginBottom: 16 }}>
              <h4>Запросити нового учасника</h4>

              <form
                onSubmit={handleInviteSubmitFromMembers}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <input
                  type="email"
                  placeholder="Email користувача"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      email: e.target.value,
                    })
                  }
                  required
                  style={input(theme)}
                />

                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      role: e.target.value,
                    })
                  }
                  style={input(theme)}
                >
                  <option value="member">Учасник (перегляд)</option>
                  <option value="editor">Редактор</option>
                </select>

                <button style={saveBtn(theme)} type="submit">
                  ➕ Запросити
                </button>
              </form>

              {inviteResult && (
                <p style={{ marginTop: 10, fontSize: 14 }}>
                  {inviteResult.message}
                </p>
              )}
            </div>

            {/* === OWNER === */}
            {membersCalendar.owner && (
              <div
                style={{
                  padding: 6,
                  borderBottom: theme.cardBorder,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: theme.textMuted,
                  }}
                >
                  Власник
                </div>
                <b>
                  {membersCalendar.owner.email ||
                    membersCalendar.owner.fullName ||
                    membersCalendar.owner.name}
                </b>
              </div>
            )}

            {/* NO MEMBERS */}
            {!membersCalendar.editors?.length &&
              !membersCalendar.members?.length && (
                <p style={{ fontSize: 14 }}>Додаткових учасників немає</p>
              )}

            {/* === EDITORS === */}
            {membersCalendar.editors?.map((u) => {
              const id = u._id || u.id || u;
              const label =
                u.email || u.fullName || u.name || String(id);

              const isSelf = id?.toString() === currentUserId?.toString();

              const canEdit = myRoleInMembersCalendar === "owner";
              const canRemove = canEdit || isSelf;

              return (
                <div
                  key={`editor-${id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 6,
                    borderBottom: theme.cardBorder,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                      }}
                    >
                      Редактор
                    </div>
                    <b>{label}</b>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {canEdit && (
                      <select
                        value="editor"
                        onChange={(e) =>
                          updateMemberRole(id, e.target.value)
                        }
                        style={input(theme)}
                      >
                        <option value="member">Перегляд</option>
                        <option value="editor">Редактор</option>
                      </select>
                    )}

                    {canRemove && (
                      <button
                        style={deleteBtn(theme)}
                        onClick={() => removeMember(id)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* === MEMBERS === */}
            {membersCalendar.members?.map((u) => {
              const id = u._id || u.id || u;
              const label =
                u.email || u.fullName || u.name || String(id);

              const isSelf = id?.toString() === currentUserId?.toString();

              const canEdit = myRoleInMembersCalendar === "owner";
              const canRemove = canEdit || isSelf;

              return (
                <div
                  key={`member-${id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 6,
                    borderBottom: theme.cardBorder,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                      }}
                    >
                      Учасник
                    </div>
                    <b>{label}</b>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {canEdit && (
                      <select
                        value="member"
                        onChange={(e) =>
                          updateMemberRole(id, e.target.value)
                        }
                        style={input(theme)}
                      >
                        <option value="member">Перегляд</option>
                        <option value="editor">Редактор</option>
                      </select>
                    )}

                    {canRemove && (
                      <button
                        style={deleteBtn(theme)}
                        onClick={() => removeMember(id)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 12 }}>
              <button style={cancelBtn(theme)} onClick={closeMembersModal}>
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ STYLES ============ */

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
  maxHeight: "80vh",
  overflowY: "auto",
  borderRadius: 16,
  padding: 25,
  background: theme.cardBg,
  border: theme.cardBorder,
  boxShadow: theme.cardShadow,
  color: theme.text,
});

const input = (theme) => ({
  padding: "8px 12px",
  borderRadius: 8,
  background: theme.inputBg,
  border: theme.cardBorder,
  color: theme.text,
  fontSize: 13,
});

const textarea = (theme) => ({
  ...input(theme),
  minHeight: 60,
  resize: "vertical",
});

const saveBtn = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
});

const deleteBtn = (theme) => ({
  background: "#ef4444",
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
});

const cancelBtn = (theme) => ({
  background: theme.primarySoft,
  color: theme.text,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
});

const listItem = (theme) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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
  fontSize: 13,
});

const hideBtn = (theme) => ({
  background: "#eab308",
  color: "white",
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
});

const membersBtn = (theme) => ({
  background: "#6366f1",
  color: "white",
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
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
  fontSize: 13,
});
