import { getApiV1Base } from "@/lib/api/apiBase";
import { setAccessToken } from "@/lib/auth/token";
import { apiUserToSession, apiUserToSessionWithOverrides } from "@/lib/auth/mapUser";
import { http } from "@/lib/api/client";
import type { ApiAuthUser, AuthLoginResponse, UserSession } from "@/types";

/** GET /profile — current user + verification flags (replaces legacy GET /auth/me for session refresh). */
type ProfileResponse = {
  message?: string;
  user: ApiAuthUser;
};

function unwrapProfilePayload(data: unknown): ApiAuthUser {
  let x: unknown = data;
  if (x && typeof x === "object" && "data" in x && (x as { data: unknown }).data !== undefined) {
    x = (x as { data: unknown }).data;
  }
  if (x && typeof x === "object" && "user" in x) {
    return (x as ProfileResponse).user;
  }
  return x as ApiAuthUser;
}

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
  const { data } = await http.get<unknown>("/profile", { skipStoreContext: true });
  const user = unwrapProfilePayload(data);
  return apiUserToSession(user);
}

/** Resend email verification link. Backend expects `{ email }`. */
export async function resendVerificationEmail(email: string): Promise<void> {
  await http.post("/auth/resend-verification", { email: email.trim() });
}
