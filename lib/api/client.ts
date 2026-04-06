import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getApiV1Base } from "@/lib/api/apiBase";
import { getApiErrorCode } from "@/lib/auth/apiErrors";
import { getAccessToken, setAccessToken } from "@/lib/auth/token";
import { getActiveStoreId } from "@/lib/store/activeStoreId";

export function apiBaseUrl(): string {
  return getApiV1Base();
}

export const http = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
  withCredentials: true,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiV1Base();
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const storeId = getActiveStoreId();
  if (storeId && !config.skipStoreContext) {
    config.headers["x-store-id"] = storeId;
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<{
        accessToken?: string;
        access_token?: string;
      }>(`${getApiV1Base()}/auth/refresh`, {}, { withCredentials: true, timeout: 30_000 });
      const token = data.accessToken ?? data.access_token ?? "";
      if (!token) {
        setAccessToken(null);
        return null;
      }
      setAccessToken(token);
      return token;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (status === 403 && typeof window !== "undefined") {
      const code = getApiErrorCode(error);
      if (code === "AUTH_REQUIRED") {
        const path = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?returnUrl=${encodeURIComponent(path)}`);
        return new Promise(() => {});
      }
    }

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const url = String(original.url ?? "");
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }
    original._retry = true;
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return Promise.reject(error);
    }
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return http(original);
  },
);
