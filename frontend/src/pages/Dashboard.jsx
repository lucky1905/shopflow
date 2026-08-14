import { useEffect, useState } from "react";
import api from "../api/api";
import DashboardCard from "../components/DashboardCard";
import "../styles/Dashboard.css";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const productRes = await api.get("/products");
      const salesRes = await api.get("/sales");

      setProducts(productRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load dashboard data");
    }
  };

  const totalProducts = products.length;
  const totalSales = sales.length;

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount),
    0
  );

  const lowStockProducts = products.filter(
    (product) => product.stock <= product.min_stock
  );

  return (
    <div className="dashboard">
      <h1>📊 Dashboard</h1>

      <div className="cards">
        <DashboardCard
          title="Total Products"
          value={totalProducts}
          color="#2563eb"
          icon="📦"
        />

        <DashboardCard
          title="Total Sales"
          value={totalSales}
          color="#16a34a"
          icon="🛒"
        />

        <DashboardCard
          title="Revenue"
          value={`₹${totalRevenue}`}
          color="#ea580c"
          icon="💰"
        />

        <DashboardCard
          title="Low Stock"
          value={lowStockProducts.length}
          color="#dc2626"
          icon="⚠️"
        />
      </div>

      <div className="section">
        <h2>🧾 Recent Sales</h2>

        <table>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="4">No Sales Found</td>
              </tr>
            ) : (
              sales.slice().reverse().map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.sale_id}</td>
                  <td>{sale.payment_method}</td>
                  <td>₹{Number(sale.total_amount).toFixed(2)}</td>
                  <td>{new Date(sale.sale_date).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h2>⚠️ Low Stock Products</h2>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Min Stock</th>
            </tr>
          </thead>

          <tbody>
            {lowStockProducts.length === 0 ? (
              <tr>
                <td colSpan="3">No Low Stock Products</td>
              </tr>
            ) : (
              lowStockProducts.map((product) => (
                <tr key={product.product_id}>
                  <td>{product.product_name}</td>
                  <td className="low-stock">{product.stock}</td>
                  <td>{product.min_stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;