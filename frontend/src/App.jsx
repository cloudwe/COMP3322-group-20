import { useState } from "react";
import ProductCatalog from "./ProductCatalog";
import CartSidebar from "./CartSidebar";
import "./store.css";

export default function App() {
  // Hardcoded for the prototype
  const [products] = useState([
    { id: 1, name: "Premium Jasmine Rice (50kg)", price: 450, stock: 12 },
    { id: 2, name: "Atlantic Salmon Fillets (Box)", price: 850, stock: 5 },
    { id: 3, name: "Organic Soy Sauce (5L)", price: 120, stock: 30 }
  ]);

  const [cart, setCart] = useState([]);

  function addToCart(product) {
    // Week 3 principle: Never mutate state directly, spread into a new array
    setCart([...cart, product]); 
  }

  return (
    <>
      <header className="store-header">
        <h1>FreshTrack B2B Store</h1>
        <nav>Items in Cart: {cart.length}</nav>
      </header>
      
      <main className="store-layout">
        <ProductCatalog products={products} onAdd={addToCart} />
        <CartSidebar cart={cart} />
      </main>
    </>
  );
}