import { useCallback, useEffect, useRef, useState } from 'react';

// Executa "fetcher" agora e a cada intervalMs (tempo quase real).
export default function usePolling(fetcher, intervalMs, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ data, error: null, loading: false, updatedAt: new Date() });
    } catch (err) {
      setState((s) => ({ ...s, error: err.message, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
    if (!intervalMs) return undefined;
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, intervalMs, ...deps]);

  return { ...state, reload: load };
}
