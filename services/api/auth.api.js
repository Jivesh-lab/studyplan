import client from "./client.js";

export const signupApi = (payload) => client.post("/api/auth/signup", payload);

export const loginApi = (payload) => client.post("/api/auth/login", payload);

export const googleAuthApi = (credential) =>
  client.post("/api/auth/google", { credential });

export const meApi = () => client.get("/api/auth/me"); // ADD THIS
