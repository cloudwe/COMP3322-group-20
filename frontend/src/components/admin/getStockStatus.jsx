import styles from "./Admin.module.css";

export default function getStockStatus(product) {
  const quantity = Number(product.available_quantity);
  const reorderLevel = Number(product.reorder_level);

  if (quantity <= 0) return { label: "Out of stock", className: styles.statusDanger };
  if (quantity <= reorderLevel) return { label: "Low stock", className: styles.statusWarning };
  return { label: "In stock", className: styles.statusGood };
}