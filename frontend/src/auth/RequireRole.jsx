import { useAuth } from "./AuthContext";
import Login from "./Login";

// Wraps a page so it's only reachable with the right role.
// - Not logged in  → show login screen
// - Wrong role     → show "Access denied"
// - Correct role   → render the page
export default function RequireRole({ role, children }) {
  const { isAuthed, user } = useAuth();

  if (!isAuthed) {
    return <Login requiredRole={role} />;
  }
  if (role && user?.role !== role) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Access denied</h2>
        <p>
          This area requires an {role} account. You are signed in as{" "}
          {user?.role}.
        </p>
      </div>
    );
  }
  return children;
}
