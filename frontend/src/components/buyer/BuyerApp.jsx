import { useEffect, useState } from "react";
import ProductCatalog from "./ProductCatalog";
import CartSidebar from "./CartSidebar";
import HeroCarousel from "./HeroCarousel";
import AuthPanel from "./AuthPanel";
import { useAuth } from "../../auth/useAuth";
import { apiFetch } from "../../api";
import styles from "./Buyer.module.css";

// ── TSE CHUN HONG: Buyer Storefront entry point ──
// All backend URLs are centralized in ../api (API_BASE).

// Hardcoded fallback used only when the backend isn't reachable yet,
// so the UI never looks completely empty during development. Real data
// replaces it as soon as a user is logged in and the API responds.
const FALLBACK_PRODUCTS = [
  { id: 1, name: "Premium Jasmine Rice (50kg)", price: 450, stock: 12, category: "Grains", emoji: "🌾", hot: true, moq: 1, unit: "bags" },
  { id: 2, name: "Atlantic Salmon Fillets (Box)", price: 850, stock: 5, category: "Fish", emoji: "🐟", hot: true, moq: 1, unit: "box" },
  { id: 3, name: "Organic Soy Sauce (5L)", price: 120, stock: 30, category: "Sauces", emoji: "🥢", hot: false, moq: 1, unit: "bottles" },
  { id: 4, name: "Fresh Broccoli (10kg)", price: 90, stock: 20, category: "Vegetables", emoji: "🥦", hot: true, moq: 1, unit: "crates" },
  { id: 5, name: "Free-range Eggs (30pk)", price: 75, stock: 40, category: "Dairy", emoji: "🥚", hot: false, moq: 1, unit: "trays" },
  { id: 6, name: "Grass-fed Beef Cubes (5kg)", price: 480, stock: 8, category: "Meat", emoji: "🥩", hot: false, moq: 1, unit: "packs" },
  { id: 7, name: "Whole Tilapia (Box)", price: 220, stock: 15, category: "Fish", emoji: "🐠", hot: false, moq: 1, unit: "box" },
  { id: 8, name: "Organic Carrots (10kg)", price: 60, stock: 25, category: "Vegetables", emoji: "🥕", hot: false, moq: 1, unit: "crates" },
];

// Map the backend's product shape -> the shape this UI expects.
// Backend sends (see product.repository.js): name, wholesale_price,
// available_quantity, category_name, unit, minimum_order_quantity, ...
function normalize(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.wholesale_price,
    stock: p.available_quantity,
    category: p.category_name,
    emoji: "📦", // placeholder until real images (image_url) are wired in
    hot: Boolean(p.is_hot), // TODO: ask Katarina to add an `is_hot` column
    moq: p.minimum_order_quantity || 1,
    unit: p.unit,
  };
}

export default function BuyerApp() {
  const { token, isAuthed, user, logout } = useAuth();
  const isBuyer = isAuthed && user?.role === "BUYER";

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(["All"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showAuth, setShowAuth] = useState(false);

  // Server-backed cart
  const [cartItems, setCartItems] = useState([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [orderDone, setOrderDone] = useState(false);
  const [cartError, setCartError] = useState("");

  // Load products + categories from the backend once a user is logged in.
  // (Both endpoints require auth, so guests keep the fallback data.)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiFetch("/api/products", { token })
      .then((rows) => {
        if (!cancelled && Array.isArray(rows) && rows.length) {
          setProducts(rows.map(normalize));
        }
      })
      .catch(() => {
        /* keep fallback data — backend not reachable */
      });
    apiFetch("/api/categories", { token })
      .then((rows) => {
        if (!cancelled && Array.isArray(rows) && rows.length) {
          setCategories(["All", ...rows.map((c) => c.name)]);
        }
      })
      .catch(() => {
        /* keep fallback-derived categories */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load the buyer's cart from the backend whenever a buyer logs in.
  // When not a buyer, we simply don't fetch (CartSidebar shows the sign-in
  // prompt and cartCount below is gated on isBuyer), so no synchronous
  // setState is needed here.
  useEffect(() => {
    if (!isBuyer) return;
    let cancelled = false;
    apiFetch("/api/cart", { token })
      .then((data) => {
        if (!cancelled) {
          setCartItems(data.items || []);
          setCartSubtotal(data.subtotal || 0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isBuyer, token]);

  async function reloadCart() {
    const data = await apiFetch("/api/cart", { token });
    setCartItems(data.items || []);
    setCartSubtotal(data.subtotal || 0);
  }

  async function addToCart(product) {
    // Not a buyer? Open the sign-in panel instead of silently doing nothing.
    if (!isBuyer) {
      setShowAuth(true);
      return;
    }
    try {
      setCartError("");
      await apiFetch("/api/cart", {
        token,
        method: "POST",
        body: { product_id: product.id, quantity: product.moq || 1 },
      });
      await reloadCart();
    } catch (err) {
      setCartError(err.message || "Could not add to cart");
    }
  }

  async function increment(productId) {
    try {
      setCartError("");
      // Respect the product's minimum order quantity (backend rejects less).
      const p = products.find((x) => x.id === productId);
      const qty = p?.moq || 1;
      await apiFetch("/api/cart", {
        token,
        method: "POST",
        body: { product_id: productId, quantity: qty },
      });
      await reloadCart();
    } catch (err) {
      setCartError(err.message || "Could not update cart");
    }
  }

  async function removeFromCart(productId) {
    try {
      setCartError("");
      await apiFetch(`/api/cart/${productId}`, { token, method: "DELETE" });
      await reloadCart();
    } catch (err) {
      setCartError(err.message || "Could not remove item");
    }
  }

  async function checkout(deliveryAddress) {
    try {
      setCartError("");
      await apiFetch("/api/orders", {
        token,
        method: "POST",
        body: { delivery_address: deliveryAddress },
      });
      setOrderDone(true);
      await reloadCart();
    } catch (err) {
      setCartError(err.message || "Could not place order");
    }
  }

  const cartCount = isBuyer
    ? cartItems.reduce((sum, i) => sum + i.quantity, 0)
    : 0;

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const hotProducts = products.filter((p) => p.hot);
  // If the DB has no `hot` items yet, feature the first few so the hero
  // banner still shows something (remove once is_hot is added).
  const heroItems = hotProducts.length ? hotProducts : products.slice(0, 3);

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

        <div className={styles.headerRight}>
          <div className={styles.headerCart}>
            🛒 <strong>{cartCount}</strong> in cart
          </div>
          <div className={styles.headerActions}>
            {isAuthed ? (
              <>
                <span className={styles.headerUser}>
                  {user?.email} · {user?.role}
                </span>
                <button className={styles.headerBtn} onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <button
                className={styles.headerBtn}
                onClick={() => setShowAuth((s) => !s)}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && !isAuthed && (
        <div className={styles.authWrap}>
          <AuthPanel onClose={() => setShowAuth(false)} />
        </div>
      )}

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
        <CartSidebar
          items={cartItems}
          subtotal={cartSubtotal}
          isBuyer={isBuyer}
          isAuthed={isAuthed}
          onIncrement={increment}
          onRemove={removeFromCart}
          onCheckout={checkout}
          onSignIn={() => setShowAuth(true)}
          onClearError={() => setCartError("")}
          error={cartError}
          orderDone={orderDone}
          onResetOrderDone={() => setOrderDone(false)}
        />
      </main>
    </div>
  );
}
