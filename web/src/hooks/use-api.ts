'use client';

import api from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

type State<T> = { url: string | null; data: T | null; error: boolean };

export function useApi<T>(url: string | null) {
  const [state, setState] = useState<State<T>>({ url: null, data: null, error: false });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    api
      .get<T>(url)
      .then(({ data }) => !cancelled && setState({ url, data, error: false }))
      .catch(() => !cancelled && setState({ url, data: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const { data } = await api.get<T>(url);
      setState({ url, data, error: false });
    } catch {
      setState({ url, data: null, error: true });
    }
  }, [url]);

  const fresh = state.url === url;
  return {
    data: fresh ? state.data : null,
    error: fresh && state.error,
    loading: url !== null && !fresh,
    reload,
  };
}
