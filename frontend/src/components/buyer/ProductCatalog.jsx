import styles from "./Buyer.module.css";

export default function ProductCatalog({ products, onAdd }) {
  if (!products.length) {
    return <p className={styles.empty}>No products match your search.</p>;
  }

  return (
    <section className={styles.grid}>
      {products.map((p) => (
        <article className={styles.card} key={p.id}>
          <div className={styles.cardMedia}>{p.emoji}</div>
          {p.hot && <span className={styles.hotTag}>Hot</span>}
          <h3 className={styles.cardName}>{p.name}</h3>
          <p className={styles.cardCat}>{p.category}</p>
          <div className={styles.cardFooter}>
            <span className={styles.cardPrice}>${p.price}</span>
            <span className={styles.cardStock}>
              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
            </span>
          </div>
          <button
            className={styles.addBtn}
            disabled={p.stock === 0}
            onClick={() => onAdd(p)}
          >
            {p.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </article>
      ))}
    </section>
  );
}
