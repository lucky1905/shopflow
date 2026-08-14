import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/POS.jsx";
import Inventory from "./pages/Inventory.jsx";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Dashboard</Link>{" | "}
        <Link to="/pos">POS</Link>{" | "}
        <Link to="/inventory">Inventory</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;