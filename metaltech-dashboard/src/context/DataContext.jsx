import { createContext, useContext, useMemo } from 'react';
import usePolling from '../hooks/usePolling';
import { useSettings } from './SettingsContext';
import { buildAlerts } from '../utils/alerts';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { api, intervalo, limiar } = useSettings();

  const { data, error, loading, updatedAt, reload } = usePolling(
    async () => {
      const [status, leituras] = await Promise.all([api.getStatus(), api.getLeituras(200)]);
      return { status, leituras };
    },
    intervalo * 1000,
    [api],
  );

  const alertas = useMemo(() => (data ? buildAlerts(data.leituras, { limiar }) : []), [data, limiar]);

  const value = useMemo(
    () => ({
      status: data?.status ?? null,
      leituras: data?.leituras ?? [],
      alertas,
      error,
      loading,
      updatedAt,
      reload,
    }),
    [data, alertas, error, loading, updatedAt, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
