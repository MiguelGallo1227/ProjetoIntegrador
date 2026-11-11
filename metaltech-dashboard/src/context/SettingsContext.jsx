import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createApi } from '../services/api';

const STORAGE_KEY = 'metaltech:settings';

const DEFAULTS = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  intervalo: 5, // segundos
  limiar: 85, // % do reservatorio
  tema: 'light',
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', settings.tema);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* armazenamento indisponivel: segue sem persistir */
    }
  }, [settings]);

  const api = useMemo(
    () => createApi({ baseUrl: settings.apiUrl, useMock: settings.useMock }),
    [settings.apiUrl, settings.useMock],
  );

  const value = useMemo(
    () => ({
      ...settings,
      api,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings(DEFAULTS),
      toggleTema: () => setSettings((s) => ({ ...s, tema: s.tema === 'dark' ? 'light' : 'dark' })),
    }),
    [settings, api],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
