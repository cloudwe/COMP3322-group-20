import styles from "./Buyer.module.css";

export default function CartSidebar({ cart }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  function handleCheckout() {
    alert("Checkout functionality will send a POST request to the API here.");
  }

  return (
    <aside className={styles.cartSidebar}>
      <h2 className={styles.cartTitle}>Your Order</h2>
      {cart.length === 0 ? (
        <p className={styles.cartEmpty}>Your cart is empty.</p>
      ) : (
        <ul className={styles.cartList}>
          {cart.map((item, index) => (
            <li className={styles.cartItem} key={index}>
              <span>{item.name}</span>
              <span>${item.price}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.cartTotal}>
        <span>Total</span>
        <strong>${total}</strong>
      </div>
      <button
        className={styles.checkoutBtn}
        onClick={handleCheckout}
        disabled={cart.length === 0}
      >
        Confirm Order
      </button>
    </aside>
  );
}
