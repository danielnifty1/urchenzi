import axios, { AxiosError } from "axios";
import type { UserSession } from "@/types";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const authClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://api.urchenziconnect.local",
});

const normalizeError = (error: unknown, fallback: string): Error => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    const message = data?.message || data?.error || error.message;
    return new Error(message || fallback);
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
};

export const authApi = {
  login: async (payload: LoginPayload): Promise<UserSession> => {
    try {
      const { data } = await authClient.post<UserSession>("/auth/login", payload);
      return data;
    } catch (error) {
      throw normalizeError(error, "Unable to sign in.");
    }
  },
  register: async (payload: RegisterPayload): Promise<UserSession> => {
    try {
      const { data } = await authClient.post<UserSession>("/auth/register", payload);
      return data;
    } catch (error) {
      throw normalizeError(error, "Unable to create account.");
    }
  },
};
