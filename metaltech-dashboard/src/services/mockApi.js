// API simulada (deterministica por tempo) para desenvolver sem o back-end.
// Segue o mesmo contrato da API REST real (ver README).
const STEP = 30000; // uma peca a cada 30 s
const CYCLE = 55; // pecas ate esvaziar o reservatorio
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967295;
}

const tipo = (i) => (hash(i) < 0.62 ? 'METALICA' : 'NAO_METALICA');

function nivel(i) {
  const cycle = Math.floor(i / CYCLE);
  const pos = i % CYCLE;
  const anomalo = cycle % 4 === 3; // ciclos com enchimento acelerado
  const burst = anomalo ? Math.min(Math.max(pos - 20, 0), 8) * 2.2 : 0;
  const ruido = (hash(i + 7) - 0.5) * 0.6;
  return Math.min(100, Math.max(0, pos * 1.75 + burst + ruido + 4));
}

export async function getLeituras(limite = 200) {
  await delay();
  const now = Math.floor(Date.now() / STEP);
  return Array.from({ length: limite }, (_, k) => {
    const i = now - (limite - 1 - k);
    return {
      id: i,
      timestamp: new Date(i * STEP).toISOString(),
      tipoPeca: tipo(i),
      nivelReservatorio: Number(nivel(i).toFixed(1)),
    };
  });
}

export async function getStatus() {
  await delay();
  const now = Math.floor(Date.now() / STEP);
  const inicioDia = Math.floor(new Date().setHours(0, 0, 0, 0) / STEP);
  let metalicas = 0;
  let naoMetalicas = 0;
  for (let i = inicioDia; i <= now; i += 1) {
    if (tipo(i) === 'METALICA') metalicas += 1;
    else naoMetalicas += 1;
  }
  return {
    esteiraId: 'ESTEIRA-01',
    nome: 'Esteira de triagem 01',
    operando: true,
    ultimaLeitura: new Date(now * STEP).toISOString(),
    totalMetalicas: metalicas,
    totalNaoMetalicas: naoMetalicas,
    nivelReservatorio: Number(nivel(now).toFixed(1)),
  };
}
