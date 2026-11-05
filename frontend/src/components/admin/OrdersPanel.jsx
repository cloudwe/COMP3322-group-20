import styles from "./Admin.module.css";

export default function OrdersPanel() {
  return (
    <section className={styles.panel} aria-labelledby="orders-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="orders-title" className={styles.panelTitle}>Recent orders</h2>
          <p className={styles.panelSubtitle}>Latest customer orders</p>
        </div>
      </div>
      <p className={styles.placeholder}>
        Order data is not connected yet. The backend currently provides
        <code> GET /api/products</code>, but does not have an orders API.
      </p>
    </section>
  );
}