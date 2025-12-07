import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CalendarPage from "./pages/CalendarPage";
import UserProfile from "./pages/UserProfile";
import ChatPage from "./pages/ChatPage";

import { AuthContext, AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import SettingsModal from "./components/settings/SettingsModal";   // <--- ВАЖНО!

function AppContent() {
  const { user } = useContext(AuthContext);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Слушаем событие от Navbar для открытия настроек
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open_settings", handler);
    return () => window.removeEventListener("open_settings", handler);
  }, []);

  return (
    <>
      <Navbar />

      {/* ГЛОБАЛЬНОЕ ОКНО НАСТРОЕК */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/calendar" /> : <Login />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/calendar" /> : <Register />}
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
