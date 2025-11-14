import React, { useState, useContext } from "react";
import { register as registerAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerAPI(form);
    if (res.token) {
      login(res.user, res.token);
      navigate("/calendar");
    } else {
      setMessage(res.error || "Ошибка регистрации");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Имя"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">Зарегистрироваться</button>
        </form>
        <p style={{ color: "gray" }}>{message}</p>
        <a href="/">Уже есть аккаунт? Войти</a>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(120deg, #3b82f6, #9333ea)",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "10px",
  },
};
