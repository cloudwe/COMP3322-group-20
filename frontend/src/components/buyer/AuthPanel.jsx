import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { apiFetch } from "../../api";
import styles from "./Buyer.module.css";

// Storefront sign-in / register panel.
// Buyers must have an account (and log in) before they can use the cart,
// because the backend's /api/cart and /api/orders require a BUYER token.
export default function AuthPanel({ onClose }) {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    email: "",
    password: "",
    contact_name: "",
    business_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await login(form.email, form.password);
      onClose?.();
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: {
          email: form.email,
          password: form.password,
          contact_name: form.contact_name,
          business_name: form.business_name || null,
          phone: form.phone || null,
        },
      });
      setInfo("Account created. Please sign in.");
      setMode("login");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className={styles.authPanel}>
      <div className={styles.authTabs}>
        <button
          type="button"
          className={mode === "login" ? styles.authTabActive : styles.authTab}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "register" ? styles.authTabActive : styles.authTab}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Register
        </button>
      </div>

      {mode === "login" ? (
        <form className={styles.authForm} onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
          {error && <p className={styles.authError}>{error}</p>}
          <button type="submit" className={styles.authSubmit}>
            Sign in
          </button>
        </form>
      ) : (
        <form className={styles.authForm} onSubmit={handleRegister}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
          <label>
            Contact name
            <input
              value={form.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
              required
            />
          </label>
          <label>
            Business name
            <input
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
          {info && <p className={styles.authInfo}>{info}</p>}
          {error && <p className={styles.authError}>{error}</p>}
          <button type="submit" className={styles.authSubmit}>
            Create account
          </button>
        </form>
      )}
    </div>
  );
}
