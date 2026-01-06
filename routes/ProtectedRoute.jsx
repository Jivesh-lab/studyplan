import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowOnboardingOnly = false }) => {
  const { isAuthenticated, loading, onboardingCompleted } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If onboarding not complete: user can ONLY access onboarding page
  if (!onboardingCompleted && !allowOnboardingOnly) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding complete and user is visiting onboarding, send to dashboard
  if (onboardingCompleted && allowOnboardingOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
