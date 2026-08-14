import { useState } from "react";
import api from "../api/api";

function POS() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  const searchProduct = async () => {
    console.log("Function Started");
    console.log("Barcode:", barcode);

    try {
      const response = await api.get(`/products/barcode/${barcode}`);

      console.log("Response:", response.data);

      setProduct(response.data);
      setError("");
    } catch (err) {
      console.log("Error:", err);

      setProduct(null);
      setError("Product not found!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>POS Billing</h1>

      <input
        type="text"
        placeholder="Enter Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      />

      <button
        onClick={() => {
          console.log("Button Clicked");
          searchProduct();
        }}
      >
        Search
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {product && (
        <div style={{ marginTop: "20px" }}>
          <h3>{product.product_name}</h3>
          <p>Barcode: {product.barcode}</p>
          <p>Category: {product.category}</p>
          <p>Price: ₹{product.selling_price}</p>
          <p>Stock: {product.stock}</p>
        </div>
      )}
    </div>
  );
}

export default POS;