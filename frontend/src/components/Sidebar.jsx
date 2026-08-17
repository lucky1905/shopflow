import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  History,
  Settings,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🛍 ShopFlow AI</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          <Boxes size={20} />
          <span>Inventory</span>
        </NavLink>

        <NavLink
          to="/pos"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          <ShoppingCart size={20} />
          <span>POS Billing</span>
        </NavLink>

        <NavLink
          to="/sales-history"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          <History size={20} />
          <span>Sales History</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button>
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;