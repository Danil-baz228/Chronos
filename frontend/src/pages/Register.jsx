import React, { useState, useContext } from "react";
import { register as registerAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/LanguageContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [message, setMessage] = useState("");

  const { login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      setMessage(t("register.passwordMismatch"));
      return;
    }

    const res = await registerAPI({
      username: form.username,
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });

    if (res.token) {
      login(res.user, res.token);
      navigate("/calendar");
    } else {
      setMessage(res.error || t("register.error"));
    }
  };

  return (
    <div style={wrapper(theme)}>
      <div style={card(theme)}>
        <h2 style={title(theme)}>{t("register.title")}</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <input
            placeholder={t("register.username")}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            style={input(theme)}
          />

          <input
            placeholder={t("register.fullName")}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            style={input(theme)}
          />

          <input
            type="email"
            placeholder={t("register.email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={input(theme)}
          />

          <input
            type="password"
            placeholder={t("register.password")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={input(theme)}
          />

          <input
            type="password"
            placeholder={t("register.confirm")}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
            style={input(theme)}
          />

          <button type="submit" style={btn(theme)}>
            {t("register.submit")}
          </button>
        </form>

        {message && (
          <p style={{ color: theme.error, marginTop: 12, textAlign: "center" }}>
            {message}
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/" style={{ color: theme.primary }}>
            {t("register.haveAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const isMobile = window.innerWidth < 480;

const wrapper = (theme) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: isMobile ? "20px" : "0",
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
