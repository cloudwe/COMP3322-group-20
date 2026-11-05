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

// (No hardcoded fallback — products are always loaded live from the database.
// Logged-in buyers get the real catalogue (re-fetched after checkout so stock
// updates); guests get an empty list because /api/products is still auth-gated
// on the backend — left as-is per project decision.)

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

  const [products, setProducts] = useState([]); // real DB data only; empty until the API responds
  const [categories, setCategories] = useState(["All"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [authOpen, setAuthOpen] = useState(false); // login dock starts collapsed; click to expand
  const [userOpen, setUserOpen] = useState(true); // logged-in user card starts expanded; click bar to minimize

  // Server-backed cart
  const [cartItems, setCartItems] = useState([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [orderDone, setOrderDone] = useState(false);
  const [cartError, setCartError] = useState("");

  // Load the real catalogue from the backend on mount and whenever the token
  // changes. Guests (no token) just get an empty list here; once the backend's
  // listing endpoints are made public they'll see the live products too.
  // No hardcoded fallback — products are always real DB data (or empty).
  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/products", token ? { token } : {})
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) setProducts(rows.map(normalize));
      })
      .catch(() => {
        /* keep whatever we already have (e.g. empty list) */
      });
    apiFetch("/api/categories", token ? { token } : {})
      .then((rows) => {
        if (!cancelled && Array.isArray(rows) && rows.length) {
          setCategories(["All", ...rows.map((c) => c.name)]);
        }
      })
      .catch(() => {});
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

  // Re-fetch the product list so the displayed stock reflects any change
  // (e.g. after an order deducts stock). The backend is the source of truth.
  async function reloadProducts() {
    try {
      const rows = await apiFetch("/api/products", { token });
      if (Array.isArray(rows) && rows.length) setProducts(rows.map(normalize));
    } catch {
      /* keep the current product data if the refresh fails */
    }
  }

  async function addToCart(product) {
    // Not a buyer? Open the sign-in panel instead of silently doing nothing.
    if (!isBuyer) {
      setAuthOpen(true);
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
      await reloadProducts(); // refresh stock so the quantity drops after purchase
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
        </div>
      </header>

      {/* Fixed, always-visible auth dock (top-right). Stays on scroll,
          collapses/expands via the title bar. */}
      <div className={styles.authDock}>
        {isAuthed ? (
          <div className={styles.authDockBox}>
            <button
              type="button"
              className={styles.authDockBar}
              onClick={() => setUserOpen((o) => !o)}
              aria-expanded={userOpen}
            >
              <span className={styles.authDockBarLabel}>👤 {user?.email}</span>
              <span className={styles.authDockCaret}>
                {userOpen ? "▾" : "▸"}
              </span>
            </button>
            {userOpen && (
              <div className={styles.authUserCard}>
                <span className={styles.authUserEmail}>{user?.email}</span>
                <span className={styles.authUserRole}>{user?.role}</span>
                <button className={styles.headerBtn} onClick={logout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.authDockBox}>
            <button
              type="button"
              className={styles.authDockBar}
              onClick={() => setAuthOpen((o) => !o)}
              aria-expanded={authOpen}
            >
              <span className={styles.authDockBarLabel}>
                👤 Sign in / Register
              </span>
              <span className={styles.authDockCaret}>
                {authOpen ? "▾" : "▸"}
              </span>
            </button>
            {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
          </div>
        )}
      </div>

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
          dockOpen={authOpen}
          userOpen={userOpen}
          items={cartItems}
          subtotal={cartSubtotal}
          isBuyer={isBuyer}
          isAuthed={isAuthed}
          onIncrement={increment}
          onRemove={removeFromCart}
          onCheckout={checkout}
          onSignIn={() => setAuthOpen(true)}
          onClearError={() => setCartError("")}
          error={cartError}
          orderDone={orderDone}
          onResetOrderDone={() => setOrderDone(false)}
        />
      </main>
    </div>
  );
}
