import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";

function App() {
  return (
    <BrowserRouter>
      <nav
        style={{
          background: "#2563eb",
          padding: "15px 25px",
          display: "flex",
          gap: "20px",
        }}
      >
        <Link
          to="/"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          📊 Dashboard
        </Link>

        <Link
          to="/pos"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          🛒 POS
        </Link>

        <Link
          to="/inventory"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          📦 Inventory
        </Link>

        <Link
          to="/sales-history"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          📜 Sales History
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales-history" element={<SalesHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;