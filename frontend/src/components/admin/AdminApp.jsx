import styles from "./Admin.module.css";

// ───────────────────────────────────────────────
// CHAN LONG HIM — ADMIN ERP DASHBOARD ZONE
// Build the ERP dashboard here. This file and
// Admin.module.css are yours; Tse won't touch them.
// Add your own components (InventoryTable,
// OrderPanel, ExpiryTracker, ...) in this folder
// and import them below.
// ───────────────────────────────────────────────
export default function AdminApp() {
  return (
    <div className={styles.adminShell}>
      <header className={styles.adminHeader}>
        <h1>FreshTrack ERP Dashboard</h1>
        <nav>Admin</nav>
      </header>
      <main className={styles.adminMain}>
        <p className={styles.placeholder}>
          Admin dashboard goes here. This is Chan Long Him's zone — start
          adding inventory tables, order panels, and expiry tracking
          components in this folder.
        </p>
      </main>
    </div>
  );
}
