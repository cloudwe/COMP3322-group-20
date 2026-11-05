import getDaysUntilExpiry from "./getDaysUntilExpiry";
import formatDate from "./formatDate";
import formatQuantity from "./formatQuantity";
import styles from "./Admin.module.css";

const EXPIRY_ALERT_DAYS = 14;

export default function ExpiryTracker({ products, loading, hasError }) {
  const expiringProducts = products
    .map((product) => ({
      ...product,
      daysUntilExpiry: getDaysUntilExpiry(product.nearest_expiry_date),
    }))
    .filter(
      (product) =>
        product.daysUntilExpiry !== null &&
        product.daysUntilExpiry >= 0 &&
        product.daysUntilExpiry <= EXPIRY_ALERT_DAYS
    )
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return (
    <section className={styles.panel} aria-labelledby="expiry-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="expiry-title" className={styles.panelTitle}>Expiry tracking</h2>
          <p className={styles.panelSubtitle}>Products expiring within 14 days</p>
        </div>
        <span className={styles.panelCount}>{expiringProducts.length}</span>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading expiry information…</p>
      ) : hasError ? (
        <p className={styles.emptyState}>Expiry information could not be loaded.</p>
      ) : expiringProducts.length === 0 ? (
        <p className={styles.emptyState}>No upcoming expiries found.</p>
      ) : (
        <ul className={styles.expiryList}>
          {expiringProducts.map((product) => (
            <li className={styles.expiryItem} key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <span>
                  {formatQuantity(product.available_quantity)} {product.unit} available
                </span>
              </div>
              <div className={styles.expiryDate}>
                <strong>
                  {product.daysUntilExpiry === 0
                    ? "Today"
                    : `${product.daysUntilExpiry}d`}
                </strong>
                <span>{formatDate(product.nearest_expiry_date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.panelNote}>
        Based on each product’s nearest expiry date from the products API.
      </p>
    </section>
  );
}