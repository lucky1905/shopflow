import { useEffect, useState } from "react";
import api from "../api/api";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get("/sales");
      setSales(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load sales history");
    }
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.sale_id.toString().includes(search) ||
      sale.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "25px" }}>
      <h1>📜 Sales History</h1>

      <input
        type="text"
        placeholder="Search by Sale ID or Payment..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead
          style={{
            background: "#2563eb",
            color: "white",
          }}
        >
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
                <td>{sale.payment_method}</td>
                <td>₹{Number(sale.total_amount).toFixed(2)}</td>

                <td>
                  <button
                    onClick={() => setSelectedSale(sale)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedSale && (
        <div
          style={{
            marginTop: "30px",
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "10px",
            background: "#f9f9f9",
          }}
        >
          <h2>Sale #{selectedSale.sale_id}</h2>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(selectedSale.sale_date).toLocaleString()}
          </p>

          <p>
            <strong>Payment:</strong> {selectedSale.payment_method}
          </p>

          <p>
            <strong>Total:</strong> ₹
            {Number(selectedSale.total_amount).toFixed(2)}
          </p>

          <h3>Items</h3>

          <table
            border="1"
            cellPadding="8"
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
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

          <br />

          <button
            onClick={() => setSelectedSale(null)}
            style={{
              background: "crimson",
              color: "white",
              border: "none",
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default SalesHistory;