// Boxplot horizontal em SVG. Props: stats (resultado de describe), min, max, unit
export default function BoxPlot({ stats, min = 0, max = 100, unit = '%' }) {
  const W = 600;
  const H = 120;
  const pad = 28;
  const x = (v) => pad + ((v - min) / (max - min)) * (W - pad * 2);
  const mid = 52;
  const half = 20;
  const ticks = [0, 25, 50, 75, 100].map((p) => min + ((max - min) * p) / 100);
  const stroke = 'var(--mt-steel)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Boxplot: mediana ${stats.median.toFixed(1)}${unit}, Q1 ${stats.q1.toFixed(1)}, Q3 ${stats.q3.toFixed(1)}, ${stats.outliers.length} outliers`}>
      <line x1={x(stats.whiskerLow)} x2={x(stats.q1)} y1={mid} y2={mid} stroke={stroke} strokeWidth="2" />
      <line x1={x(stats.q3)} x2={x(stats.whiskerHigh)} y1={mid} y2={mid} stroke={stroke} strokeWidth="2" />
      <line x1={x(stats.whiskerLow)} x2={x(stats.whiskerLow)} y1={mid - 9} y2={mid + 9} stroke={stroke} strokeWidth="2" />
      <line x1={x(stats.whiskerHigh)} x2={x(stats.whiskerHigh)} y1={mid - 9} y2={mid + 9} stroke={stroke} strokeWidth="2" />
      <rect x={x(stats.q1)} y={mid - half} width={Math.max(2, x(stats.q3) - x(stats.q1))} height={half * 2}
        fill="var(--mt-metal)" fillOpacity="0.28" stroke={stroke} strokeWidth="2" rx="3" />
      <line x1={x(stats.median)} x2={x(stats.median)} y1={mid - half} y2={mid + half} stroke="var(--mt-nonmetal)" strokeWidth="4" />
      {stats.outliers.map((v, i) => (
        <circle key={i} cx={x(v)} cy={mid} r="4" fill="none" stroke="#d0453b" strokeWidth="2" />
      ))}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={92} y2={98} stroke="currentColor" opacity="0.5" />
          <text x={x(t)} y={113} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.7">{t}{unit}</text>
        </g>
      ))}
    </svg>
  );
}
