// API simulada para desenvolver sem o back-end. Os sensores saem em hexadecimal, como no CLP.
const STEP = 30000; // uma peca a cada 30 s
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const hex = (n) => `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;

function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967295;
}

const metalica = (i) => hash(i) < 0.62;

export async function getLeituras(limite = 100) {
  await delay();
  const now = Math.floor(Date.now() / STEP);
  return Array.from({ length: limite }, (_, k) => {
    const i = now - (limite - 1 - k);
    return {
      id: i,
      timestamp: new Date(i * STEP).toISOString(),
      indutivo: hex(metalica(i) ? 1 : 0),
      capacitivo: hex(1),
      distancia: hex(Math.round(40 + hash(i + 3) * 260)),
    };
  });
}

export async function getStatus() {
  await delay();
  const now = Math.floor(Date.now() / STEP);
  const inicioDia = Math.floor(new Date().setHours(0, 0, 0, 0) / STEP);
  let m = 0;
  let n = 0;
  for (let i = inicioDia; i <= now; i += 1) {
    if (metalica(i)) m += 1;
    else n += 1;
  }
  return { nome: 'Esteira de triagem', operando: true, ultimaLeitura: new Date(now * STEP).toISOString(), totalMetalicas: m, totalNaoMetalicas: n };
}
