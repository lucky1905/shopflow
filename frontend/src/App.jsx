import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";

import "./App.css";

function App() {
  const linkStyle = ({ isActive }) => ({
    color: "#fff",
    textDecoration: "none",
    fontWeight: "600",
    padding: "10px 16px",
    borderRadius: "8px",
    background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
    transition: "0.3s",
  });

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="logo">
          🛍️ ShopFlow AI
        </div>

        <div className="nav-links">
          <NavLink to="/" style={linkStyle} end>
            📊 Dashboard
          </NavLink>

          <NavLink to="/inventory" style={linkStyle}>
            📦 Inventory
          </NavLink>

          <NavLink to="/pos" style={linkStyle}>
            🛒 POS
          </NavLink>

          <NavLink to="/sales-history" style={linkStyle}>
            📜 Sales History
          </NavLink>
        </div>
      </nav>

      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/sales-history" element={<SalesHistory />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;