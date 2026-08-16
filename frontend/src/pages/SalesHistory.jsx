import { useEffect, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import "../styles/SalesHistory.css";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/LoadingSpinner.css";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sales");
      setSales(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.sale_id.toString().includes(search) ||
      sale.payment_method
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="sales-container">
      <div className="sales-header">
        <div>
          <h1>📜 Sales History</h1>
          <p>Track all completed sales transactions</p>
        </div>
      </div>

      <input
        className="search-box"
        type="text"
        placeholder="Search by Sale ID or Payment..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Items</th>
            </tr>
          </thead>

          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="5">No Sales Found</td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.sale_id}</td>
                  <td>{new Date(sale.sale_date).toLocaleString()}</td>
                  <td>{sale.payment_method.toUpperCase()}</td>
                  <td>₹{Number(sale.total_amount).toFixed(2)}</td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() => setSelectedSale(sale)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {selectedSale && (
        <div className="sale-details">
          <h2>Sale #{selectedSale.sale_id}</h2>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(selectedSale.sale_date).toLocaleString()}
          </p>

          <p>
            <strong>Payment:</strong>{" "}
            {selectedSale.payment_method.toUpperCase()}
          </p>

          <p>
            <strong>Total:</strong> ₹
            {Number(selectedSale.total_amount).toFixed(2)}
          </p>

          <h3>Purchased Items</h3>

          <table className="sales-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {selectedSale.items.map((item) => (
                <tr key={item.sale_item_id}>
                  <td>{item.product_id}</td>
                  <td>{item.quantity}</td>
                  <td>₹{Number(item.unit_price).toFixed(2)}</td>
                  <td>₹{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="close-btn"
            onClick={() => setSelectedSale(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default SalesHistory;