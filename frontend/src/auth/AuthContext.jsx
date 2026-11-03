import { useState } from "react";
import { AuthContext } from "./authContext";

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
// SHARED AUTH (frontend infrastructure — both Tse
// and Chan use this; neither "owns" it exclusively)
// Holds the logged-in user + token + role, and
// exposes login() / logout() (see useAuth.js).
// ───────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored()); // { token, user: { id, email, role } }

  async function login(email, password) {
    // ── DEV FALLBACK ──
    // Lets you test the admin gate BEFORE Katarina's real
    // login endpoint exists. Rule: emails containing "admin"
    // are treated as ADMIN, everything else as BUYER.
    // DELETE this block once POST /api/auth/login is live.
    if (import.meta.env.DEV) {
      const role = email.toLowerCase().includes("admin") ? "ADMIN" : "BUYER";
      const fake = { token: "dev-token", user: { id: 0, email, role } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fake));
      setAuth(fake);
      return fake;
    }

    // ── REAL LOGIN (contract to agree with backend) ──
    // Expects backend to return: { token, user: { id, email, role } }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
    return data;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthed: !!auth }}>
      {children}
    </AuthContext.Provider>
  );
}
