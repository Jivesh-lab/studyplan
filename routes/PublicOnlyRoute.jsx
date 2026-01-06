import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PublicOnlyRoute = () => {
  const { isAuthenticated, onboardingCompleted, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Outlet />;

  return <Navigate to={onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
};

export default PublicOnlyRoute;
