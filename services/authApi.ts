import { setAccessToken } from "@/lib/auth/token";
import { apiUserToSession } from "@/lib/auth/mapUser";
import { http } from "@/lib/api/client";
import type { AuthLoginResponse, UserSession } from "@/types";

export async function loginWithPassword(email: string, password: string): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/login", {
    email: email.trim(),
    password,
  });
  setAccessToken(data.access_token);
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
  setAccessToken(data.access_token);
  return apiUserToSession(data.user);
}

export function googleAuthRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";
  return `${base}/auth/google`;
}
