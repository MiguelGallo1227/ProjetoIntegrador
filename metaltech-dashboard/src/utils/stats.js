// Estatistica descritiva usada no painel (mesmos criterios pedidos para Ciencia de Dados).
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const mean = (a) => (a.length ? sum(a) / a.length : 0);

export function quantile(values, q) {
  if (!values.length) return 0;
  const s = [...values].sort((x, y) => x - y);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
}

export const median = (a) => quantile(a, 0.5);

export function mode(values) {
  const freq = new Map();
  values.forEach((v) => {
    const k = Math.round(v);
    freq.set(k, (freq.get(k) || 0) + 1);
  });
  let best = null;
  let count = 0;
  freq.forEach((n, k) => {
    if (n > count) {
      count = n;
      best = k;
    }
  });
  return best;
}

export function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(sum(values.map((v) => (v - m) ** 2)) / (values.length - 1));
}

export function describe(values) {
  const n = values.length;
  if (!n) {
    return { n: 0, min: 0, max: 0, mean: 0, median: 0, mode: null, std: 0, q1: 0, q3: 0, iqr: 0,
      lower: 0, upper: 0, whiskerLow: 0, whiskerHigh: 0, outliers: [] };
  }
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const inside = values.filter((v) => v >= lower && v <= upper);
  return {
    n,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    std: stdDev(values),
    q1,
    q3,
    iqr,
    lower,
    upper,
    whiskerLow: inside.length ? Math.min(...inside) : q1,
    whiskerHigh: inside.length ? Math.max(...inside) : q3,
    outliers: values.filter((v) => v < lower || v > upper),
  };
}

export function histogram(values, binSize = 10, max = 100) {
  const bins = [];
  for (let start = 0; start < max; start += binSize) {
    bins.push({ faixa: `${start}-${start + binSize}`, inicio: start, quantidade: 0 });
  }
  values.forEach((v) => {
    const idx = Math.min(bins.length - 1, Math.max(0, Math.floor(v / binSize)));
    bins[idx].quantidade += 1;
  });
  return bins;
}
