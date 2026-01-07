import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { StudyPlanProvider } from "./context/StudyPlanContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

import LoginForm from "./pages/LoginForm.jsx";
import SignupForm from "./pages/SignupForm.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  return (
    <AuthProvider>
      <StudyPlanProvider>
        <DndProvider backend={HTML5Backend}>
          <div className="min-h-screen bg-slate-50 font-sans">
            <Routes>
              {/* Public routes (login/signup) */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignupForm />} />
              </Route>

              {/* Onboarding (must be logged in) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowOnboardingOnly={true}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard (must be logged in + onboarding complete) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </DndProvider>
      </StudyPlanProvider>
    </AuthProvider>
  );
}

export default App;
