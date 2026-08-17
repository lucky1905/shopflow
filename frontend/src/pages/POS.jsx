import { useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import "../styles/POS.css";

function POS() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const searchProduct = async () => {
    if (!barcode.trim()) {
      toast.warning("Please enter a barcode");
      return;
    }

    try {
      const res = await api.get(`/products/barcode/${barcode}`);
      setProduct(res.data);
    } catch (err) {
      setProduct(null);
      toast.error("Product not found");
    }
  };

  const addToCart = () => {
    if (!product) return;

    if (quantity > product.stock) {
      toast.warning(`Only ${product.stock} item(s) available`);
      return;
    }

    const existing = cart.find(
      (item) => item.product_id === product.product_id
    );

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + Number(quantity),
                total:
                  (item.quantity + Number(quantity)) * item.price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          barcode: product.barcode,
          price: product.selling_price,
          quantity: Number(quantity),
          total:
            product.selling_price * Number(quantity),
        },
      ]);
    }

    toast.success("Product added to cart");

    setBarcode("");
    setProduct(null);
    setQuantity(1);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.info("Item removed");
  };

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.warning("Cart is empty");
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

      toast.success("Sale completed successfully");

      setCart([]);
      setBarcode("");
      setProduct(null);
      setQuantity(1);
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.detail ||
          "Failed to complete sale"
      );
    }
  };

  return (
    <div className="pos-container">
      <h1>🛒 POS Billing</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Scan / Enter Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <button onClick={searchProduct}>
          Search
        </button>
      </div>

      {product && (
        <div className="product-card">
          <h2>{product.product_name}</h2>

          <p><strong>Barcode:</strong> {product.barcode}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Price:</strong> ₹{product.selling_price}</p>
          <p><strong>Stock:</strong> {product.stock}</p>

          <div className="qty-row">
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
            />

            <button onClick={addToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      )}
            <h2 className="section-title">🛍 Shopping Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="cart-table">
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
                      className="remove-btn"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary-card">
            <h2>Grand Total: ₹{grandTotal.toFixed(2)}</h2>

            <p>
              <strong>Items:</strong> {cart.length}
            </p>

            <div className="payment-row">
              <label>Payment Method</label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>

            <button
              className="checkout-btn"
              onClick={completeSale}
            >
              Complete Sale
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default POS;