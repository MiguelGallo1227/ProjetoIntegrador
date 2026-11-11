export const TIPOS = {
  METALICA: { label: 'Metálica', color: '#2a7f9e' },
  NAO_METALICA: { label: 'Não metálica', color: '#d9822b' },
};

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

export const fmtNum = (n, digits = 1) =>
  Number(n).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// success = normal | warning = perto do limite | danger = acima do limite de alerta
export function nivelTone(nivel, limiar) {
  if (nivel >= limiar) return 'danger';
  if (nivel >= limiar - 15) return 'warning';
  return 'success';
}

export const TONE_LABEL = { success: 'Normal', warning: 'Atenção', danger: 'Crítico' };
