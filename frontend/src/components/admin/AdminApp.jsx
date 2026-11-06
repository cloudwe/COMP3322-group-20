import { useEffect, useState } from "react";
import getDaysUntilExpiry from "./getDaysUntilExpiry";
import ExpiryTracker from "./ExpiryTracker";
import SummaryCard from "./SummaryCard";
import InventoryTable from "./InventoryTable";
import OrdersPanel from "./OrdersPanel";
import styles from "./Admin.module.css";

// ───────────────────────────────────────────────
// CHAN LONG HIM — ADMIN ERP DASHBOARD ZONE
// Build the ERP dashboard here. This file and
// Admin.module.css are yours; Tse won't touch them.
// Add your own components (InventoryTable,
// OrderPanel, ExpiryTracker, ...) in this folder
// and import them below.
// ───────────────────────────────────────────────

const EXPIRY_ALERT_DAYS = 14;
const API_BASE_URL = "";
  .replace(/\/$/, "");

export default function AdminApp() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token"); // get the token
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: {
            "Authorization": `Bearer ${token}` // needs header.
          }
        });
        if (!response.ok) {
          throw new Error(`Products API returned HTTP ${response.status}.`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Products API returned an unexpected response.");
        }

        if (active) setProducts(data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const lowStockCount = products.filter((product) => {
    const quantity = Number(product.available_quantity);
    return quantity <= Number(product.reorder_level);
  }).length;

  const expiringCount = products.filter((product) => {
    const daysUntilExpiry = getDaysUntilExpiry(product.nearest_expiry_date);
    return daysUntilExpiry !== null &&
      daysUntilExpiry >= 0 &&
      daysUntilExpiry <= EXPIRY_ALERT_DAYS;
  }).length;

  return (
    <div className={styles.adminShell}>
      <header className={styles.adminHeader}>
        <h1>FreshTrack ERP Dashboard</h1>
        <nav>Admin</nav>
      </header>
      <main className={styles.adminMain}>
        <div className={styles.dashboardIntro}>
          <div>
            <h2>Overview</h2>
            <p>Inventory, recent orders, and expiry alerts.</p>
          </div>
          <button
            className={styles.refreshButton}
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>Could not load inventory: {error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        )}

        <section className={styles.summaryGrid} aria-label="Inventory summary">
          <SummaryCard
            label="Active products"
            value={loading ? "—" : products.length}
            detail="From the product catalog"
          />
          <SummaryCard
            label="Low or out of stock"
            value={loading ? "—" : lowStockCount}
            detail="At or below reorder level"
          />
          <SummaryCard
            label="Expiring soon"
            value={loading ? "—" : expiringCount}
            detail="Within the next 14 days"
          />
        </section>

        <section className={styles.panel} aria-labelledby="inventory-title">
          <div className={styles.panelHeading}>
            <div>
              <h2 id="inventory-title" className={styles.panelTitle}>Inventory</h2>
              <p className={styles.panelSubtitle}>Current catalog and stock levels</p>
            </div>
            <span className={styles.panelCount}>{loading ? "…" : products.length}</span>
          </div>
          <InventoryTable products={products} loading={loading} hasError={Boolean(error)} />
        </section>

        <div className={styles.panelGrid}>
          <OrdersPanel />
          <ExpiryTracker products={products} loading={loading} hasError={Boolean(error)} />
        </div>
      </main>
    </div>
  );
}
