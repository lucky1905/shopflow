function DashboardCard({ title, value, color, icon }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{
          background: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </div>

      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>

      <div className="stat-subtitle">
        Updated just now
      </div>
    </div>
  );
}

export default DashboardCard;