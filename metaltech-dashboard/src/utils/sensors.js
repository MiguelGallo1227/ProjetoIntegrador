// Os sensores chegam em hexadecimal (ex.: "0x01A3" ou "01A3"). A validacao fica no back-end;
// aqui so convertemos para numero para exibir e classificar.
export function parseSensor(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean') return raw ? 1 : 0;
  if (typeof raw === 'number') return raw;
  const n = parseInt(String(raw).trim().replace(/^0x/i, ''), 16);
  return Number.isNaN(n) ? null : n;
}

export const toHex = (n, digits = 4) => `0x${n.toString(16).toUpperCase().padStart(digits, '0')}`;

// Texto cru para mostrar ao lado do valor convertido
export const rawLabel = (raw, value) =>
  typeof raw === 'string' ? raw : value === null ? '–' : toHex(value);

// Indutivo detecta so metal; capacitivo detecta qualquer material.
// Logo: indutivo ativo => metalica; so capacitivo ativo => nao metalica.
export function classify({ indutivo, capacitivo }) {
  if (indutivo > 0) return 'METALICA';
  if (capacitivo > 0) return 'NAO_METALICA';
  return null;
}

export function normalizeLeitura(l) {
  const indutivo = parseSensor(l.indutivo);
  const capacitivo = parseSensor(l.capacitivo);
  const distancia = parseSensor(l.distancia);
  return {
    id: l.id,
    timestamp: l.timestamp,
    indutivo,
    capacitivo,
    distancia,
    raw: { indutivo: l.indutivo, capacitivo: l.capacitivo, distancia: l.distancia },
    tipoPeca: l.tipoPeca || classify({ indutivo, capacitivo }),
  };
}
