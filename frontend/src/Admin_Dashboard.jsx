import { useEffect, useState } from "react";
import "./Admin_Dashboard.css";
import { getProducts } from "./connect.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pending: 0,
    lowStock: 0
  });
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token = localStorage.getItem("token"); // get token
        const [orderResponse, productResponse] = await Promise.all([
          // authorization header is necessary.
          fetch("http://c3322-pg20.cs.hku.hk:3000/api/orders", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }),
          getProducts() 
        ]);

        const ordersData = await orderResponse.json();
        const productsData = await productResponse.json();

        setOrders(ordersData);
        setProducts(productsData);

        setStats({
            totalOrders: ordersData.length,
            revenue: ordersData.reduce((sum, o) => sum + Number(o.total), 0),
            pending: ordersData.filter(o => o.status === "PROCESSING").length,
            lowStock: productsData.filter(p => p.stock < 5).length
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <h2>Admin ERP</h2>
        <nav>
          <button>Overview</button>
          <button>Orders</button>
          <button>Products</button>
          <button>Inventory</button>
          <button>Reports</button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Dashboard</h1>
          <div className="admin-actions">
            <input placeholder="Search..." />
            <button>+ Add Product</button>
          </div>
        </header>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Total Orders</span>
            <h3>{stats.totalOrders}</h3>
          </div>
          <div className="summary-card">
            <span>Revenue</span>
            <h3>${stats.revenue}</h3>
          </div>
          <div className="summary-card">
            <span>Pending</span>
            <h3>{stats.pending}</h3>
          </div>
          <div className="summary-card">
            <span>Low Stock</span>
            <h3>{stats.lowStock}</h3>
          </div>
        </section>

        <section className="dashboard-panels">
          <div className="panel">
            <h3>Recent Orders</h3>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.status}</td>
                    <td>${order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h3>Inventory Alerts</h3>
            <ul>
              {products
                .filter(p => p.stock < 10)
                .map(product => (
                  <li key={product.id}>
                    {product.name} - {product.stock} left
                  </li>
                ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}