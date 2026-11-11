import { quantile } from './stats';

// Criterio de alerta (alinhado com Ciencia de Dados):
//  1) NIVEL_CRITICO: o reservatorio cruzou o limiar configurado.
//  2) ENCHIMENTO_ACELERADO: aumento de nivel entre leituras acima da cerca superior
//     do boxplot (Q3 + 1,5 x IQR) da taxa de enchimento.
export function buildAlerts(leituras, { limiar = 85 } = {}) {
  const alerts = [];
  if (leituras.length < 2) return alerts;

  const taxas = [];
  for (let i = 1; i < leituras.length; i += 1) {
    const delta = leituras[i].nivelReservatorio - leituras[i - 1].nivelReservatorio;
    if (delta > 0) taxas.push({ leitura: leituras[i], delta });
  }
  const valores = taxas.map((t) => t.delta);
  const q1 = quantile(valores, 0.25);
  const q3 = quantile(valores, 0.75);
  const cerca = q3 + 1.5 * (q3 - q1);

  taxas
    .filter((t) => t.delta > cerca)
    .forEach(({ leitura, delta }) =>
      alerts.push({
        id: `taxa-${leitura.id}`,
        tipo: 'ENCHIMENTO_ACELERADO',
        severidade: 'warning',
        timestamp: leitura.timestamp,
        mensagem: `Reservatório enchendo mais rápido que o previsto: +${delta.toFixed(1)} p.p. em uma leitura (limite estatístico ${cerca.toFixed(1)}).`,
      }),
    );

  for (let i = 1; i < leituras.length; i += 1) {
    const prev = leituras[i - 1].nivelReservatorio;
    const cur = leituras[i].nivelReservatorio;
    if (prev < limiar && cur >= limiar) {
      alerts.push({
        id: `nivel-${leituras[i].id}`,
        tipo: 'NIVEL_CRITICO',
        severidade: 'danger',
        timestamp: leituras[i].timestamp,
        mensagem: `Reservatório atingiu ${cur.toFixed(1)}%, acima do limiar de ${limiar}%. Programe o esvaziamento.`,
      });
    }
  }
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
