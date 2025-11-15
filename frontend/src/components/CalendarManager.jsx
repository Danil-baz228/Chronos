import React, { useState } from "react";

export default function CalendarManager({ calendars, setCalendars, token }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#3b82f6", description: "" });

  // 🔹 открыть модалку (добавить или редактировать)
  const openModal = (calendar = null) => {
    if (calendar) {
      setEditingCalendar(calendar);
      setForm({
        name: calendar.name,
        color: calendar.color || "#3b82f6",
        description: calendar.description || "",
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

  // ✅ Добавление или обновление календаря
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingCalendar
        ? `http://localhost:5000/api/calendars/${editingCalendar._id}`
        : "http://localhost:5000/api/calendars";
      const method = editingCalendar ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data._id) {
        if (editingCalendar) {
          setCalendars((prev) =>
            prev.map((c) => (c._id === data._id ? data : c))
          );
        } else {
          setCalendars((prev) => [...prev, data]);
        }
        closeModal();
      }
    } catch (error) {
      console.error("Ошибка при сохранении календаря:", error);
    }
  };

  // ❌ Удаление календаря
  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот календарь?")) return;
    try {
      await fetch(`http://localhost:5000/api/calendars/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalendars((prev) => prev.filter((c) => c._id !== id));
      closeModal();
    } catch (error) {
      console.error("Ошибка при удалении:", error);
    }
  };

  return (
    <div>
      <button style={styles.manageBtn} onClick={() => openModal()}>
        🗂 Управление календарями
      </button>

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "10px" }}>
              {editingCalendar ? "✏️ Редактировать календарь" : "➕ Новый календарь"}
            </h3>

            <form onSubmit={handleSave} style={styles.form}>
              <input
                type="text"
                placeholder="Название"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                title="Выберите цвет календаря"
              />
              <textarea
                placeholder="Описание (необязательно)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ resize: "none", height: "60px" }}
              ></textarea>

              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveBtn}>
                  💾 Сохранить
                </button>
                {editingCalendar && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingCalendar._id)}
                    style={styles.deleteBtn}
                  >
                    🗑 Удалить
                  </button>
                )}
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>

            <h4 style={{ marginTop: "20px" }}>📅 Мои календари</h4>
            <ul style={styles.list}>
              {calendars.map((c) => (
                <li key={c._id} style={styles.listItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        backgroundColor: c.color || "#3b82f6",
                        width: "12px",
                        height: "12px",
                        display: "inline-block",
                        borderRadius: "50%",
                      }}
                    ></span>
                    <strong>{c.name}</strong>
                  </div>
                  <button
                    onClick={() => openModal(c)}
                    style={styles.smallEditBtn}
                  >
                    ✏️
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  manageBtn: {
    background: "#6366f1",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.2s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    width: "420px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  saveBtn: {
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#e5e7eb",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    marginTop: "10px",
    paddingLeft: 0,
    maxHeight: "200px",
    overflowY: "auto",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  smallEditBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
