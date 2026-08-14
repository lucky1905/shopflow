import { useEffect, useState } from "react";
import api from "../api/api";

function ProductForm({ product, onClose, refreshProducts }) {
  const [formData, setFormData] = useState({
    barcode: "",
    product_name: "",
    category: "",
    buying_price: "",
    selling_price: "",
    stock: "",
    min_stock: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode || "",
        product_name: product.product_name || "",
        category: product.category || "",
        buying_price: product.buying_price || "",
        selling_price: product.selling_price || "",
        stock: product.stock || "",
        min_stock: product.min_stock || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      barcode: formData.barcode,
      product_name: formData.product_name,
      category: formData.category,
      buying_price: Number(formData.buying_price),
      selling_price: Number(formData.selling_price),
      stock: Number(formData.stock),
      min_stock: Number(formData.min_stock),
    };

    try {
      if (product) {
        await api.put(`/products/${product.product_id}`, payload);
        alert("✅ Product Updated Successfully");
      } else {
        await api.post("/products", payload);
        alert("✅ Product Added Successfully");
      }

      refreshProducts();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Operation Failed");
    }
  };

  return (
    <div className="form-overlay">
      <div className="product-form">

        <h2>
          {product ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="barcode"
            placeholder="Barcode"
            value={formData.barcode}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="product_name"
            placeholder="Product Name"
            value={formData.product_name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="buying_price"
            placeholder="Buying Price"
            value={formData.buying_price}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="selling_price"
            placeholder="Selling Price"
            value={formData.selling_price}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={formData.stock}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="min_stock"
            placeholder="Minimum Stock"
            value={formData.min_stock}
            onChange={handleChange}
            required
          />

          <div className="form-buttons">
            <button type="submit">
              {product ? "Update Product" : "Add Product"}
            </button>

            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default ProductForm;