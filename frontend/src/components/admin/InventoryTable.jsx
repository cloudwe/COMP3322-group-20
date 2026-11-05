import getStockStatus from "./getStockStatus";
import formatQuantity from "./formatQuantity";
import formatCurrency from "./formatCurrency";
import styles from "./Admin.module.css";

export default function InventoryTable({ products, loading, hasError }) {
  if (loading) return <p className={styles.emptyState}>Loading inventory…</p>;
  if (hasError) return <p className={styles.emptyState}>Inventory could not be loaded.</p>;
  if (products.length === 0) {
    return <p className={styles.emptyState}>No active products were returned by the API.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">SKU</th>
            <th scope="col">Category</th>
            <th scope="col">Available</th>
            <th scope="col">Reorder at</th>
            <th scope="col">Unit price</th>
            <th scope="col">Stock status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const status = getStockStatus(product);
            return (
              <tr key={product.id}>
                <th scope="row">{product.name}</th>
                <td>{product.sku || "—"}</td>
                <td>{product.category_name || "Uncategorized"}</td>
                <td>
                  {formatQuantity(product.available_quantity)} {product.unit}
                </td>
                <td>
                  {formatQuantity(product.reorder_level)} {product.unit}
                </td>
                <td>{formatCurrency(product.wholesale_price)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${status.className}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}