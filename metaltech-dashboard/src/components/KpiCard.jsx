// Props: icon, label, value, hint, color
export default function KpiCard({ icon, label, value, hint, color }) {
  return (
    <div className="panel kpi" style={{ '--kpi-color': color }}>
      <div className="kpi-label">
        <i className={`bi ${icon} me-1`} aria-hidden="true" />
        {label}
      </div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
