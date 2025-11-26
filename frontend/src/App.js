import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CalendarPage from "./pages/CalendarPage";

import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
