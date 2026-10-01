export default function ProductCatalog({ products, onAdd }) {
  return (
    <section className="catalog-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <h3>{p.name}</h3>
          <p>Price: ${p.price}</p>
          <p>Available Stock: {p.stock}</p>
          <button 
            disabled={p.stock === 0} 
            onClick={() => onAdd(p)}
          >
            {p.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      ))}
    </section>
  );
}