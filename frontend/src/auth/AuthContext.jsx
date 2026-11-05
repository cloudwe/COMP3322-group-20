import { useState } from "react";
import { AuthContext } from "./authContext";
import { apiFetch } from "../api";

const STORAGE_KEY = "freshtrack_auth";

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────
// SHARED AUTH (frontend infrastructure — both zones use this).
// Holds the logged-in user + token + role, and exposes
// login() / logout() (see useAuth.js).
//
// The backend is live, so this now talks to the REAL
// POST /api/auth/login endpoint and stores the JWT it returns.
// ───────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored()); // { token, user: { id, email, role } }

  async function login(email, password) {
    // Real login — backend returns { token, user }.
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
    return data;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  const token = auth?.token ?? null;

  return (
    <AuthContext.Provider value={{ ...auth, token, login, logout, isAuthed: !!auth }}>
      {children}
    </AuthContext.Provider>
  );
}
