import { useEffect, useState } from "react";
import styles from "./Buyer.module.css";

// Auto-rotating "Hot Selling" banner. Pauses on hover.
// "Shop now" adds the currently shown product straight to the cart.
export default function HeroCarousel({ products, onAdd }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (paused || products.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % products.length);
    }, 4000);
    return () => clearInterval(t);
  }, [paused, products.length]);

  // Reset the "Added" confirmation whenever the slide changes.
  useEffect(() => {
    setAdded(false);
  }, [index]);

  if (!products.length) return null;
  const item = products[index];

  const go = (step) =>
    setIndex((i) => (i + step + products.length) % products.length);

  function handleShop() {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.heroContent}>
        <span className={styles.heroBadge}>🔥 Hot Selling</span>
        <h2 className={styles.heroName}>{item.name}</h2>
        <p className={styles.heroPrice}>${item.price}</p>
        <button className={styles.heroBtn} onClick={handleShop}>
          {added ? "Added ✓" : "Shop now"}
        </button>
      </div>
      <div className={styles.heroEmoji}>{item.emoji}</div>

      {products.length > 1 && (
        <>
          <button
            className={`${styles.heroArrow} ${styles.left}`}
            onClick={() => go(-1)}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className={`${styles.heroArrow} ${styles.right}`}
            onClick={() => go(1)}
            aria-label="Next"
          >
            ›
          </button>
          <div className={styles.dots}>
            {products.map((_, i) => (
              <button
                key={i}
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
