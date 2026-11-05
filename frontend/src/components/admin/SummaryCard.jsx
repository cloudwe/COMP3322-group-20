import styles from "./Admin.module.css";

export default function SummaryCard({ label, value, detail }) {
  return (
    <article className={styles.summaryCard}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong className={styles.summaryValue}>{value}</strong>
      <span className={styles.summaryDetail}>{detail}</span>
    </article>
  );
}