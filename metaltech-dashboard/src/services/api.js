import * as mock from './mockApi';

// Contrato esperado (ver README):
//   GET /api/esteira/status
//   GET /api/leituras?limite=100
export function createApi({ baseUrl, useMock }) {
  if (useMock) return mock;

  const request = async (path) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`A API respondeu com erro ${res.status}.`);
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('A API demorou demais para responder.');
      throw new Error(err.message === 'Failed to fetch' ? 'Não foi possível conectar à API.' : err.message);
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    getStatus: () => request('/api/esteira/status'),
    getLeituras: (limite = 100) => request(`/api/leituras?limite=${limite}`),
  };
}
