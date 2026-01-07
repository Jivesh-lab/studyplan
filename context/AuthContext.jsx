import React, { createContext, useContext, useMemo, useState } from "react";
import { loginApi, signupApi, googleAuthApi } from "../services/api/auth.api";

const AuthContext = createContext(null);

const TOKEN_KEY = "sp_token";
const USER_KEY = "sp_user";
const PROFILE_KEY = "userProfile";

const safeParse = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => safeParse(localStorage.getItem(USER_KEY)));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  // Check if onboarding is completed (userProfile exists in localStorage)
  const onboardingCompleted = !!localStorage.getItem(PROFILE_KEY);

  const persist = ({ token: t, user: u }) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    
    // Optionally clear study plan data (uncomment if you want full logout)
    // localStorage.removeItem(PROFILE_KEY);
    // localStorage.removeItem("studyPlan");
    // localStorage.removeItem("studyStreak");
    // localStorage.removeItem("achievements");
    
    window.location.href = "/login";
  };

  const login = async ({ email, password }) => {
    const res = await loginApi({ email, password });
    persist(res.data);
    return res.data;
  };

  const signup = async ({ name, email, password }) => {
    const res = await signupApi({ name, email, password });
    persist(res.data);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await googleAuthApi(credential);
    persist(res.data);
    return res.data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      onboardingCompleted,
      login,
      signup,
      googleLogin,
      logout,
      setUser,
    }),
    [token, user, loading, isAuthenticated, onboardingCompleted]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
