import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import BuyerApp from "./components/buyer/BuyerApp";
import AdminApp from "./components/admin/AdminApp";
import RequireRole from "./auth/RequireRole";

// ───────────────────────────────────────────────
// SHARED ROUTER — the ONLY file both of you edit.
// Each person owns their own folder:
//   src/components/buyer/   → Tse Chun Hong
//   src/components/admin/   → Chan Long Him
// Login + role-gating live in src/auth/ (shared).
//
// RULE: the storefront is PUBLIC (anyone can browse).
// Only the Admin ERP area requires an ADMIN account.
// ───────────────────────────────────────────────
export default function App() {
  const { isAuthed, user, logout } = useAuth();
  const [view, setView] = useState("shop"); // "shop" | "admin"

  return (
    <>
      <nav className="app-nav">
        <button
          className={view === "shop" ? "app-nav-btn active" : "app-nav-btn"}
          onClick={() => setView("shop")}
        >
          Buyer Store
        </button>

        {/* Admin ERP button is only shown to ADMIN accounts */}
        {user?.role === "ADMIN" && (
          <button
            className={view === "admin" ? "app-nav-btn active" : "app-nav-btn"}
            onClick={() => setView("admin")}
          >
            Admin ERP
          </button>
        )}

        <span className="app-nav-user">
          {isAuthed ? `${user?.email} · ${user?.role}` : "Guest"}
        </span>

        {/* Single login lives in the fixed storefront dock (top-right).
            After signing in, admins see the "Admin ERP" button (above) and
            everyone sees "Log out"; guests just use the dock to sign in. */}
        {isAuthed && (
          <button
            className="app-nav-btn"
            onClick={() => {
              logout();
              setView("shop");
            }}
          >
            Log out
          </button>
        )}
      </nav>

      {view === "shop" ? (
        // Public storefront — no login required to browse.
        <BuyerApp />
      ) : (
        // Admin ERP — only reachable with an ADMIN account.
        <RequireRole role="ADMIN">
          <AdminApp />
        </RequireRole>
      )}
    </>
  );
}
