import { useEffect, useState } from "react";
import ProductCatalog from "./ProductCatalog";
import CartSidebar from "./CartSidebar";
import HeroCarousel from "./HeroCarousel";
import styles from "./Buyer.module.css";

// ── TSE CHUN HONG: Buyer Storefront entry point ──
// Backend base URL. Katarina's API runs on 3000 by default
// (server.js: process.env.PORT || 3000). Change here if she moves it.
const API_BASE = "http://localhost:3000";

// Hardcoded fallback used when the backend / DB isn't running yet,
// so the UI never breaks during development.
const FALLBACK_PRODUCTS = [
  { id: 1, name: "Premium Jasmine Rice (50kg)", price: 450, stock: 12, category: "Grains", emoji: "🌾", hot: true },
  { id: 2, name: "Atlantic Salmon Fillets (Box)", price: 850, stock: 5, category: "Fish", emoji: "🐟", hot: true },
  { id: 3, name: "Organic Soy Sauce (5L)", price: 120, stock: 30, category: "Sauces", emoji: "🥢", hot: false },
  { id: 4, name: "Fresh Broccoli (10kg)", price: 90, stock: 20, category: "Vegetables", emoji: "🥦", hot: true },
  { id: 5, name: "Free-range Eggs (30pk)", price: 75, stock: 40, category: "Dairy", emoji: "🥚", hot: false },
  { id: 6, name: "Grass-fed Beef Cubes (5kg)", price: 480, stock: 8, category: "Meat", emoji: "🥩", hot: false },
  { id: 7, name: "Whole Tilapia (Box)", price: 220, stock: 15, category: "Fish", emoji: "🐠", hot: false },
  { id: 8, name: "Organic Carrots (10kg)", price: 60, stock: 25, category: "Vegetables", emoji: "🥕", hot: false },
];

// Map the backend's product shape -> the shape this UI expects.
// Backend sends: name, wholesale_price, available_quantity, category_name,
// image_url, ... (see product.repository.js). It has NO `hot` flag yet.
function normalize(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.wholesale_price,
    stock: p.available_quantity,
    category: p.category_name,
    emoji: "📦",            // placeholder until real images (image_url) are wired in
    hot: Boolean(p.is_hot), // TODO: ask Katarina to add an `is_hot` column to products
  };
}

export default function BuyerApp() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Fetch real products from the backend. If the request fails (DB not up,
  // server off, etc.) we silently keep the FALLBACK_PRODUCTS above.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/products`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((rows) => {
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length) {
          setProducts(rows.map(normalize));
        }
      })
      .catch(() => {
        /* keep fallback data — backend not reachable yet */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const hotProducts = products.filter((p) => p.hot);
  // If the DB has no `hot` items yet, feature the first few so the hero
  // banner still shows something (remove once is_hot is added).
  const heroItems = hotProducts.length ? hotProducts : products.slice(0, 3);

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

      <HeroCarousel products={heroItems} onAdd={addToCart} />

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
