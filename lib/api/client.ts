import axios, { InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/auth/token";

function apiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000/api/v1";
}

export const http = axios.create({
  baseURL: apiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
  withCredentials: true,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
