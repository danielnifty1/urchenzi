import { setAccessToken } from "@/lib/auth/token";
import { apiUserToSession } from "@/lib/auth/mapUser";
import { http } from "@/lib/api/client";
import type { ApiAuthUser, AuthLoginResponse, UserSession } from "@/types";

function readAccessToken(data: AuthLoginResponse): string {
  return data.accessToken ?? data.access_token ?? "";
}

export async function loginWithPassword(email: string, password: string): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/login", {
    email: email.trim(),
    password,
  });
  setAccessToken(readAccessToken(data));
  return apiUserToSession(data.user);
}

/** Adjust body fields if your /auth/register contract differs. */
export async function registerWithPassword(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/register", {
    email: params.email.trim(),
    password: params.password,
    firstName: params.firstName ?? null,
    lastName: params.lastName ?? null,
    role: params.role ?? "customer",
  });
  setAccessToken(readAccessToken(data));
  return apiUserToSession(data.user);
}

export function googleAuthRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3010/api/v1";
  return `${base}/auth/google`;
}

export async function refreshSession(): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/refresh");
  setAccessToken(readAccessToken(data));
  return apiUserToSession(data.user);
}

export async function logoutSession(): Promise<void> {
  await http.post("/auth/logout");
}

export async function me(): Promise<UserSession> {
  const { data } = await http.get<ApiAuthUser | { user: ApiAuthUser }>("/auth/me");
  const user = "user" in data ? data.user : data;
  return apiUserToSession(user);
}
