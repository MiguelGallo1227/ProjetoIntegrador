import { createContext, useContext, useMemo } from 'react';
import usePolling from '../hooks/usePolling';
import { useSettings } from './SettingsContext';
import { normalizeLeitura } from '../utils/sensors';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { api, intervalo } = useSettings();

  const { data, error, loading, updatedAt, reload } = usePolling(
    async () => {
      const [status, leituras] = await Promise.all([api.getStatus(), api.getLeituras(100)]);
      return { status, leituras: leituras.map(normalizeLeitura) };
    },
    intervalo * 1000,
    [api],
  );

  const value = useMemo(() => {
    const leituras = data?.leituras ?? [];
    const pecas = leituras.filter((l) => l.tipoPeca);
    const contar = (t) => pecas.filter((l) => l.tipoPeca === t).length;
    const status = data?.status ?? null;
    return {
      status,
      leituras,
      ultima: leituras[leituras.length - 1] ?? null,
      // Usa os totais da API; se ela nao mandar, conta pelas leituras recebidas
      totalMetalicas: status?.totalMetalicas ?? contar('METALICA'),
      totalNaoMetalicas: status?.totalNaoMetalicas ?? contar('NAO_METALICA'),
      error,
      loading,
      updatedAt,
      reload,
    };
  }, [data, error, loading, updatedAt, reload]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
