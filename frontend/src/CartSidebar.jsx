export default function CartSidebar({ cart }) {
  // Week 2: Using reduce to calculate the total price
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  function handleCheckout() {
    alert("Checkout functionality will send a POST request to the API here.");
  }

  return (
    <aside className="cart-sidebar">
      <h2>Your Order</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cart.map((item, index) => (
            <li key={index}>{item.name} - ${item.price}</li>
          ))}
        </ul>
      )}
      <div className="cart-total">
        <strong>Total: ${total}</strong>
      </div>
      <button onClick={handleCheckout} disabled={cart.length === 0}>
        Confirm Order
      </button>
    </aside>
  );
}