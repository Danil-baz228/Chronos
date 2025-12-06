import React, { useState, useContext } from "react";
import { login as loginAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const { login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await loginAPI({
      emailOrUsername: form.emailOrUsername,
      password: form.password,
    });

    if (res.token) {
      login(res.user, res.token);
      navigate("/calendar");
    } else {
      setMessage(res.error || "Помилка авторизації");
    }
  };

  return (
    <div style={wrapper(theme)}>
      <div style={card(theme)}>
        <h2 style={title(theme)}>{t("login.title")}</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <input
            placeholder={t("login.email")}
            value={form.emailOrUsername}
            onChange={(e) =>
              setForm({ ...form, emailOrUsername: e.target.value })
            }
            required
            style={input(theme)}
          />

          <input
            type="password"
            placeholder={t("login.password")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={input(theme)}
          />

          <button type="submit" style={btn(theme)}>
            {t("login.submit")}
          </button>
        </form>

        {message && (
          <p
            style={{
              color: theme.error,
              marginTop: 12,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {message}
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/register" style={{ color: theme.primary }}>
            {t("login.noAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------- MOBILE DETECTOR ----------
const isMobile = window.innerWidth < 480;

// ---------- STYLES ----------
const wrapper = (theme) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: isMobile ? "20px" : "80px 0 0 0",
  background: theme.pageBg,
});

const card = (theme) => ({
  width: isMobile ? "100%" : 380,
  background: theme.cardBg,
  padding: isMobile ? 20 : 30,
  borderRadius: isMobile ? 12 : 16,
  border: theme.cardBorder,
  boxShadow: theme.cardShadow,
});

const title = (theme) => ({
  textAlign: "center",
  color: theme.text,
  fontSize: isMobile ? "20px" : "26px",
  marginBottom: isMobile ? 10 : 20,
});

const input = (theme) => ({
  padding: isMobile ? "14px 16px" : "12px 14px",
  borderRadius: 12,
  border: theme.cardBorder,
  background: theme.pageBg,
  color: theme.text,
  fontSize: isMobile ? "16px" : "15px",
});

const btn = (theme) => ({
  padding: isMobile ? "14px 16px" : "12px 14px",
  borderRadius: 12,
  background: theme.primarySoft,
  border: `1px solid ${theme.primary}`,
  color: theme.text,
  fontWeight: 600,
  fontSize: isMobile ? "17px" : "15px",
  cursor: "pointer",
  marginTop: 5,
});
