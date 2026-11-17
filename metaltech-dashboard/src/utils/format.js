export const TIPOS = {
  METALICA: { label: 'Metálica', color: '#2a7f9e' },
  NAO_METALICA: { label: 'Não metálica', color: '#d9822b' },
};

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
