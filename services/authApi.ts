import { getApiV1Base } from "@/lib/api/apiBase";
import { setAccessToken } from "@/lib/auth/token";
import { apiUserToSession, apiUserToSessionWithOverrides } from "@/lib/auth/mapUser";
import { http } from "@/lib/api/client";
import type { ApiAuthUser, AuthLoginResponse, UserSession } from "@/types";

function readAccessToken(data: AuthLoginResponse): string {
  return data.accessToken ?? data.access_token ?? "";
}

function readIsEmailVerified(data: AuthLoginResponse): boolean | undefined {
  const raw = data.isEmailVerifed ?? data.isEmailVerified;
  return typeof raw === "boolean" ? raw : undefined;
}

function authResponseToSession(data: AuthLoginResponse): UserSession {
  return apiUserToSessionWithOverrides(data.user, {
    status: data.status,
    emailVerified: readIsEmailVerified(data),
  });
}

export async function loginWithPassword(email: string, password: string): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/login", {
    email: email.trim(),
    password,
  });
  setAccessToken(readAccessToken(data));
  return authResponseToSession(data);
}

/** Adjust body fields if your /auth/register contract differs. */
export async function registerWithPassword(params: {
  email: string;
  password: string;
}): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/register", {
    email: params.email.trim(),
    password: params.password,
  });
  setAccessToken(readAccessToken(data));
  return authResponseToSession(data);
}

export function googleAuthRedirectUrl(): string {
  return `${getApiV1Base()}/auth/google`;
}

export async function refreshSession(): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/refresh");
  setAccessToken(readAccessToken(data));
  return authResponseToSession(data);
}

export async function logoutSession(): Promise<void> {
  await http.post("/auth/logout");
}

export async function me(): Promise<UserSession> {
  const { data } = await http.get<ApiAuthUser | { user: ApiAuthUser }>("/auth/me");
  const user = "user" in data ? data.user : data;
  return apiUserToSession(user);
}

/** Resend email verification link. Backend expects `{ email }`. */
export async function resendVerificationEmail(email: string): Promise<void> {
  await http.post("/auth/resend-verification", { email: email.trim() });
}
