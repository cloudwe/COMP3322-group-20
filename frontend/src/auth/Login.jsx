import { useState } from "react";
import { useAuth } from "./useAuth";
import styles from "./Auth.module.css";

// Shared login screen. Used by BOTH buyers and admins —
// the backend decides the role from the account.
export default function Login({ requiredRole }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      if (requiredRole && data.user.role !== requiredRole) {
        setError(`This account is not an ${requiredRole}. Try a different login.`);
      }
    } catch {
      setError("Login failed. Check your email and password.");
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <h2>FreshTrack Login</h2>
        {requiredRole && (
          <p className={styles.hint}>
            Sign in with an {requiredRole} account to continue.
          </p>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
