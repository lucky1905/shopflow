function DashboardCard({ title, value, color, icon }) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "220px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "18px" }}>
        {icon} {title}
      </h2>

      <h1
        style={{
          marginTop: "15px",
          fontSize: "32px",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

export default DashboardCard;