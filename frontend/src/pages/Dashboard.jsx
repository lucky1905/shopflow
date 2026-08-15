import { useEffect, useState } from "react";
import api from "../api/api";
import DashboardCard from "../components/DashboardCard";
import "../styles/Dashboard.css";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#dc2626",
];

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [insights, setInsights] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const productRes = await api.get("/products");
      const salesRes = await api.get("/sales");
      const insightsRes = await api.get("/predict/insights");
      const analyticsRes = await api.get("/analytics");

      setProducts(productRes.data);
      setSales(salesRes.data);
      setInsights(insightsRes.data);
      setAnalytics(analyticsRes.data);
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
          value={`₹${totalRevenue.toFixed(2)}`}
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

      {insights && (
        <div className="section">
          <h2>🤖 AI Insights</h2>

          <div className="cards">

            <DashboardCard
              title="Top Product"
              value={insights.top_product}
              color="#7c3aed"
              icon="🔥"
            />

            <DashboardCard
              title="Tomorrow Sales"
              value={`${insights.predicted_sales} Units`}
              color="#0891b2"
              icon="📈"
            />

            <DashboardCard
              title="Current Stock"
              value={insights.current_stock}
              color="#16a34a"
              icon="📦"
            />

            <DashboardCard
              title="Recommended Order"
              value={insights.recommended_order}
              color="#ea580c"
              icon="🛒"
            />

            <DashboardCard
              title="Accuracy"
              value={`${(insights.model_accuracy * 100).toFixed(0)}%`}
              color="#2563eb"
              icon="🎯"
            />

            <DashboardCard
              title="Status"
              value={insights.status}
              color="#059669"
              icon="🤖"
            />

          </div>
        </div>
      )}

      {analytics && (
        <div className="section">

          <h2>📈 Analytics Dashboard</h2>

          <div className="charts-grid">

            <div className="chart-card">
              <h3>Revenue Trend</h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="revenue"
                    fill="#2563eb"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Sales Trend</h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
                        <div className="chart-card">
              <h3>Category Wise Sales</h3>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.category_sales}
                    dataKey="quantity"
                    nameKey="category"
                    outerRadius={100}
                    label
                  >
                    {analytics.category_sales.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Top Selling Products</h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.top_products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="quantity"
                    fill="#ea580c"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

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
              sales
                .slice()
                .reverse()
                .map((sale) => (
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
              <th>Minimum Stock</th>
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