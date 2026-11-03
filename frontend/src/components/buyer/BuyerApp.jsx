import { useState } from "react";
import ProductCatalog from "./ProductCatalog";
import CartSidebar from "./CartSidebar";
import HeroCarousel from "./HeroCarousel";
import styles from "./Buyer.module.css";

// ── TSE CHUN HONG: Buyer Storefront entry point ──
// Prototype product data. In production this comes from
// GET /api/products; the `category` + `hot` fields drive
// the filters and the hero banner.
const PRODUCTS = [
  { id: 1, name: "Premium Jasmine Rice (50kg)", price: 450, stock: 12, category: "Grains", emoji: "🌾", hot: true },
  { id: 2, name: "Atlantic Salmon Fillets (Box)", price: 850, stock: 5, category: "Fish", emoji: "🐟", hot: true },
  { id: 3, name: "Organic Soy Sauce (5L)", price: 120, stock: 30, category: "Sauces", emoji: "🥢", hot: false },
  { id: 4, name: "Fresh Broccoli (10kg)", price: 90, stock: 20, category: "Vegetables", emoji: "🥦", hot: true },
  { id: 5, name: "Free-range Eggs (30pk)", price: 75, stock: 40, category: "Dairy", emoji: "🥚", hot: false },
  { id: 6, name: "Grass-fed Beef Cubes (5kg)", price: 480, stock: 8, category: "Meat", emoji: "🥩", hot: false },
  { id: 7, name: "Whole Tilapia (Box)", price: 220, stock: 15, category: "Fish", emoji: "🐠", hot: false },
  { id: 8, name: "Organic Carrots (10kg)", price: 60, stock: 25, category: "Vegetables", emoji: "🥕", hot: false },
];

export default function BuyerApp() {
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

  const filtered = PRODUCTS.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const hotProducts = PRODUCTS.filter((p) => p.hot);

  function addToCart(product) {
    setCart([...cart, product]);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M5 19c0-7 5-13 14-14 1 9-5 14-14 14z" fill="#22c55e" />
              <path
                d="M5 19C9 14 12 11 17 9"
                stroke="#15803d"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className={styles.brandName}>FreshTrack</span>
          <span className={styles.brandTag}>Wholesale</span>
        </div>
        <div className={styles.headerCart}>
          🛒 <strong>{cart.length}</strong> in cart
        </div>
      </header>

      <HeroCarousel products={hotProducts} onAdd={addToCart} />

      <section className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.chips}>
          {categories.map((c) => (
            <button
              key={c}
              className={c === category ? styles.chipActive : styles.chip}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <main className={styles.layout}>
        <ProductCatalog products={filtered} onAdd={addToCart} />
        <CartSidebar cart={cart} />
      </main>
    </div>
  );
}
