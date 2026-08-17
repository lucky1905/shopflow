import "./Topbar.css";

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>Dashboard</h2>
      </div>

      <div className="topbar-right">
        <input
          type="text"
          placeholder="Search..."
          className="search-box"
        />

        <button className="icon-btn">🔔</button>

        <div className="profile">
          <div className="avatar">L</div>
          <span>Lucky</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;