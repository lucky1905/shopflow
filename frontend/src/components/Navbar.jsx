import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        background: "#2563eb",
        padding: "15px",
        display: "flex",
        gap: "20px",
      }}
    >
      <Link to="/" style={{ color: "white" }}>
        Dashboard
      </Link>

      <Link to="/pos" style={{ color: "white" }}>
        POS
      </Link>

      <Link to="/inventory" style={{ color: "white" }}>
        Inventory
      </Link>

      <Link to="/sales" style={{ color: "white" }}>
        Sales History
      </Link>
    </nav>
  );
}

export default Navbar;