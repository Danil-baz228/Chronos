import React, { useState, useContext, useEffect, useRef } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, themeName, setThemeName } = useContext(ThemeContext);
  const { lang, setLang } = useContext(LanguageContext);

  // SAFE USER
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    user = {};
  }

  const modalRef = useRef(null);

  const [activeTab, setActiveTab] = useState("main");

  const [form, setForm] = useState({
    username: user.username || "",
    fullName: user.fullName || "",
    email: user.email || "",
  });

  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // ⚡ Новое поле — регион праздников
  const [region, setRegion] = useState(user.holidayRegion || "UA");

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  // ===================
  //  SAVE PROFILE DATA
  // ===================
  const saveProfile = async () => {
    try {
      const res = await fetch("${BASE_URL}/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Помилка оновлення");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Дані оновлено!");
    } catch (e) {
      alert("Помилка сервера");
    }
  };

  // ===================
  //   CHANGE PASSWORD
  // ===================
  const changePassword = async () => {
    try {
      const res = await fetch(
        "${BASE_URL}/api/users/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(passForm),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Не вдалося змінити пароль");
        return;
      }

      alert("Пароль змінено!");
      setPassForm({ oldPassword: "", newPassword: "" });
    } catch (e) {
      alert("Помилка сервера");
    }
  };

  // =============================
  //   UPDATE HOLIDAY REGION
  // =============================
  const updateRegion = async () => {
    try {
      const res = await fetch("${BASE_URL}/api/users/holiday-region", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ region }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Не вдалося змінити регіон свят");
        return;
      }

      // Обновляем пользователя в LS
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Регіон свят оновлено!");

    } catch (e) {
      alert("Помилка сервера");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: 880,
          height: 520,
          background: theme.cardBg,
          borderRadius: 16,
          border: theme.cardBorder,
          boxShadow: theme.cardShadow,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* SIDEBAR */}
        <div
          style={{
            width: 260,
            background:
              themeName === "light"
                ? "rgba(15,23,42,0.85)"
                : "rgba(15,23,42,0.75)",
            padding: "26px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <SidebarItem label="Основне" active={activeTab === "main"} onClick={() => setActiveTab("main")} />
          <SidebarItem label="Змінити пароль" active={activeTab === "password"} onClick={() => setActiveTab("password")} />
          <SidebarItem label="Мова" active={activeTab === "language"} onClick={() => setActiveTab("language")} />
          <SidebarItem label="Інше" active={activeTab === "other"} onClick={() => setActiveTab("other")} />
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: 28, color: theme.text, overflowY: "auto" }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ marginBottom: 16 }}>
              {activeTab === "main" && "Основна інформація"}
              {activeTab === "password" && "Зміна паролю"}
              {activeTab === "language" && "Мова інтерфейсу"}
              {activeTab === "other" && "Інші налаштування"}
            </h2>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: theme.text,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          </div>

          {/* ----------------- MAIN TAB ----------------- */}
          {activeTab === "main" && (
            <>
              {["username", "fullName", "email"].map((field) => (
                <div key={field} style={{ marginBottom: 18 }}>
                  <label>
                    {field === "username"
                      ? "Логін"
                      : field === "fullName"
                      ? "Ім’я"
                      : "Електронна пошта"}
                  </label>
                  <input
                    value={form[field]}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.value })
                    }
                    style={inputStyle(theme)}
                  />
                </div>
              ))}

              <button
                onClick={saveProfile}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: theme.primary,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                💾 Зберегти
              </button>
            </>
          )}

          {/* ----------------- PASSWORD TAB ----------------- */}
          {activeTab === "password" && (
            <>
              <input
                placeholder="Старий пароль"
                type="password"
                value={passForm.oldPassword}
                onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Новий пароль"
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                style={inputStyle(theme)}
              />

              <button
                onClick={changePassword}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: theme.primary,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🔐 Змінити пароль
              </button>
            </>
          )}

          {/* ----------------- LANGUAGE TAB ----------------- */}
          {activeTab === "language" && (
            <>
              {["uk", "en"].map((code) => (
                <div
                  key={code}
                  onClick={() => setLang(code)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 8,
                    cursor: "pointer",
                    background: lang === code ? "rgba(255,255,255,0.12)" : "transparent",
                  }}
                >
                  {code === "uk" ? "Українська" : "English"}
                </div>
              ))}
            </>
          )}

          {/* ----------------- OTHER TAB ----------------- */}
          {activeTab === "other" && (
            <>
              <h3>Тема</h3>
              {["light", "dark", "glass"].map((t) => (
                <div
                  key={t}
                  onClick={() => setThemeName(t)}
                  style={{
                    padding: "10px",
                    borderRadius: 10,
                    marginBottom: 8,
                    cursor: "pointer",
                    background: themeName === t ? "rgba(255,255,255,0.12)" : "transparent",
                  }}
                >
                  {t === "light" ? "Світла" : t === "dark" ? "Темна" : "Glass ефект"}
                </div>
              ))}

              <hr style={{ margin: "16px 0", opacity: 0.4 }} />

              {/* ---------------- РЕГИОН ПРАЗДНИКОВ ---------------- */}
              <h3>Регіон свят</h3>

              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{
                  ...inputStyle(theme),
                  width: "50%",
                  cursor: "pointer",
                }}
              >
                <option value="UA">🇺🇦 Україна</option>
                <option value="PL">🇵🇱 Польща</option>
                <option value="US">🇺🇸 США</option>
                <option value="DE">🇩🇪 Німеччина</option>
                <option value="GB">🇬🇧 Велика Британія</option>
                <option value="CA">🇨🇦 Канада</option>
                <option value="FR">🇫🇷 Франція</option>
              </select>

              <button
                onClick={updateRegion}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: theme.primary,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🌍 Зберегти регіон
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// SIDE ITEM
function SidebarItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        cursor: "pointer",
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.65)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </div>
  );
}

const inputStyle = (theme) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: theme.inputBg,
  color: theme.text,
  border: theme.cardBorder,
  marginBottom: 14,
});
