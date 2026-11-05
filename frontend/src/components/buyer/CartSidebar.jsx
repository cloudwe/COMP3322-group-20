import { useState } from "react";
import styles from "./Buyer.module.css";

// Buyer cart sidebar. Renders the SERVER-backed cart (loaded from
// /api/cart) and places a real order via POST /api/orders.
export default function CartSidebar({
  dockOpen,
  userOpen,
  items,
  subtotal,
  isBuyer,
  isAuthed,
  onIncrement,
  onRemove,
  onCheckout,
  onSignIn,
  onClearError,
  error,
  orderDone,
  onResetOrderDone,
}) {
  const [address, setAddress] = useState("");

  // When the fixed auth dock (top-right) is expanded it would cover the top of
  // this cart column. Push the cart below it so they never overlap.
  // - Login panel open  -> tall, push far down.
  // - User card open    -> short, push down a little.
  // - Nothing expanded  -> just clear the small dock pill.
  const dockStyle = dockOpen
    ? { marginTop: 320, top: 420 }
    : userOpen
    ? { marginTop: 170, top: 240 }
    : { top: 130 };

  if (orderDone) {
    return (
      <aside className={styles.cartSidebar} style={dockStyle}>
        <h2 className={styles.cartTitle}>Order placed</h2>
        <p className={styles.orderDone}>
          Thanks! Your order has been sent to the supplier.
        </p>
        <button className={styles.checkoutBtn} onClick={onResetOrderDone}>
          Continue shopping
        </button>
      </aside>
    );
  }

  // The cart and orders require a BUYER token.
  if (!isBuyer) {
    return (
      <aside className={styles.cartSidebar} style={dockStyle}>
        <h2 className={styles.cartTitle}>Your Order</h2>
        <p className={styles.cartEmpty}>
          {isAuthed
            ? "Switch to a buyer account to place an order."
            : "Sign in with a buyer account to start an order."}
        </p>
        {!isAuthed && (
          <button className={styles.checkoutBtn} onClick={onSignIn}>
            Sign in
          </button>
        )}
      </aside>
    );
  }

  async function handleCheckout() {
    if (!address.trim()) return;
    await onCheckout(address.trim());
    setAddress("");
  }

  return (
    <aside className={styles.cartSidebar} style={dockStyle}>
      <h2 className={styles.cartTitle}>Your Order</h2>
      {items.length === 0 ? (
        <p className={styles.cartEmpty}>Your cart is empty.</p>
      ) : (
        <ul className={styles.cartList}>
          {items.map((item) => (
            <li className={styles.cartItem} key={item.product_id}>
              <div className={styles.cartItemInfo}>
                <span className={styles.cartItemName}>{item.name}</span>
                <span className={styles.cartItemUnit}>
                  {item.unit} · ${Number(item.wholesale_price).toFixed(2)} ea
                </span>
              </div>
              <div className={styles.cartQty}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => onIncrement(item.product_id)}
                  aria-label="Add one more"
                >
                  +
                </button>
                <span className={styles.qtyVal}>{item.quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => onRemove(item.product_id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              <span className={styles.cartLineTotal}>
                ${Number(item.line_total).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.cartTotal}>
        <span>Subtotal</span>
        <strong>${Number(subtotal).toFixed(2)}</strong>
      </div>

      <label className={styles.addressLabel}>
        Delivery address
        <input
          className={styles.addressInput}
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            onClearError?.();
          }}
          placeholder="e.g. Shop 2, Central Market"
        />
      </label>

      {error && <p className={styles.cartError}>{error}</p>}

      <button
        className={styles.checkoutBtn}
        onClick={handleCheckout}
        disabled={items.length === 0 || !address.trim()}
      >
        Confirm Order
      </button>
    </aside>
  );
}
