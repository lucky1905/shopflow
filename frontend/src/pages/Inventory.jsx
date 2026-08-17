import { useEffect, useState } from "react";
import api from "../api/api";
import ProductForm from "../components/ProductForm";
import "../styles/Inventory.css";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/LoadingSpinner.css";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const filteredProducts = products.filter((item) =>
    item.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inventory-container">

      <div className="inventory-header">
        <h1>📦 Inventory Management</h1>

        <button
          className="add-btn"
          onClick={() => {
            setSelectedProduct(null);
            setShowForm(true);
          }}
        >
          + Add Product
        </button>
      </div>

     <div className="inventory-toolbar">
  <input
    className="search-box"
    type="text"
    placeholder="🔍 Search products..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>
      {loading ? (
        <LoadingSpinner />

      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Barcode</th>
              <th>Name</th>
              <th>Category</th>
              <th>Buying</th>
              <th>Selling</th>
              <th>Stock</th>
              <th>Min Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.product_id}>
                <td>{item.product_id}</td>
                <td>{item.barcode}</td>
                <td>{item.product_name}</td>
                <td>{item.category}</td>
                <td>₹{item.buying_price}</td>
                <td>₹{item.selling_price}</td>
                <td>{item.stock}</td>
                <td>{item.min_stock}</td>

                <td>
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteProduct(item.product_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => {
            setShowForm(false);
            setSelectedProduct(null);
          }}
          refreshProducts={fetchProducts}
        />
      )}
    </div>
  );
}

export default Inventory;