import { useState } from "react";
import api from "../api/api";

function POS() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const searchProduct = async () => {
    if (!barcode.trim()) {
      setError("Please enter a barcode");
      return;
    }

    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      setProduct(response.data);
      setError("");
    } catch (err) {
      setProduct(null);
      setError("Product not found!");
    }
  };

  const addToCart = () => {
    if (!product) return;

    const item = {
      product_id: product.product_id,
      product_name: product.product_name,
      barcode: product.barcode,
      price: product.selling_price,
      quantity: Number(quantity),
      total: product.selling_price * Number(quantity),
    };

    setCart([...cart, item]);

    setProduct(null);
    setBarcode("");
    setQuantity(1);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const saleData = {
      payment_method: paymentMethod,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      await api.post("/sales", saleData);

      alert("✅ Sale Completed Successfully!");

      setCart([]);
      setBarcode("");
      setProduct(null);
      setQuantity(1);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to complete sale.");
    }
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛒 POS Billing</h1>

      <input
        type="text"
        placeholder="Enter Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        style={{ padding: "10px", width: "250px" }}
      />

      <button
        onClick={searchProduct}
        style={{ marginLeft: "10px", padding: "10px" }}
      >
        Search
      </button>

      <br />
      <br />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {product && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            width: "350px",
            borderRadius: "8px",
          }}
        >
          <h3>{product.product_name}</h3>

          <p>Barcode: {product.barcode}</p>
          <p>Category: {product.category}</p>
          <p>Price: ₹{product.selling_price}</p>
          <p>Stock: {product.stock}</p>

          <label>Quantity: </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: "60px", marginLeft: "10px" }}
          />

          <br />
          <br />

          <button onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      )}

      <h2 style={{ marginTop: "30px" }}>🛍 Cart</h2>

      {cart.length === 0 ? (
        <p>Cart is empty.</p>
      ) : (
        <>
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
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.total}</td>

                  <td>
                    <button
                      onClick={() => removeItem(index)}
                      style={{
                        background: "red",
                        color: "white",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Grand Total: ₹{grandTotal}</h2>

          <label>Payment Method: </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>

          <br />
          <br />

          <button
            onClick={completeSale}
            style={{
              background: "green",
              color: "white",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Complete Sale
          </button>
        </>
      )}
    </div>
  );
}

export default POS;