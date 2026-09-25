import axios from 'axios';

const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
const baseURL = raw.replace(/\/$/, '');

if (typeof window !== 'undefined' && !baseURL && process.env.NODE_ENV === 'development') {
  console.error(
    'Crie web/.env.local com NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app. Sem isso, as chamadas da API batem no Next e retornam 404.'
  );
}

const api = axios.create({
  baseURL: baseURL || undefined,
  timeout: 30_000,
  withCredentials: true,
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      if (!baseURL) return null;
      const { data } = await axios.post<{ token: string }>(
        `${baseURL}/auth/refresh`,
        {},
        { timeout: 25_000, withCredentials: true }
      );
      return data.token ?? null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url =
      error.config?.baseURL && error.config?.url
        ? `${error.config.baseURL}${error.config.url}`
        : error.config?.url ?? '?';
    const status = error.response?.status;
    const msg =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message;
    if (typeof window !== 'undefined') {
      console.warn(`[API ${status}] ${error.config?.method?.toUpperCase()} ${url} → ${msg}`);
    }

    const cfg = error.config as { _retry?: boolean; url?: string } | undefined;
    if (
      typeof window !== 'undefined' &&
      status === 401 &&
      cfg &&
      !cfg._retry &&
      typeof cfg.url === 'string' &&
      !cfg.url.includes('/auth/refresh') &&
      !cfg.url.includes('/login') &&
      !cfg.url.includes('/register')
    ) {
      cfg._retry = true;
      const newTok = await refreshAccessToken();
      if (newTok && error.config) {
        setBearer(newTok);
        error.config.headers = error.config.headers ?? {};
        (error.config.headers as Record<string, string>).Authorization = `Bearer ${newTok}`;
        return api.request(error.config);
      }
    }

    return Promise.reject(error);
  }
);

export function setBearer(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(error)) return error.response?.data?.error || fallback;
  return fallback;
}

export async function uploadFile(endpoint: string, file: Blob, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file, filename);
  const { data } = await api.post<{ url: string }>(endpoint, fd);
  return data.url;
}

export default api;
