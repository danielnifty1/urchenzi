import { http } from "@/lib/api/client";
import { setAccessToken } from "@/lib/auth/token";
import { apiUserToSession, apiUserToSessionWithOverrides } from "@/lib/auth/mapUser";
import type { ApiAuthUser, AuthLoginResponse, UserSession } from "@/types";

function readAccessToken(data: AuthLoginResponse): string {
  return data.accessToken ?? data.access_token ?? "";
}

function readIsEmailVerified(data: AuthLoginResponse): boolean | undefined {
  const raw = data.isEmailVerifed ?? data.isEmailVerified;
  return typeof raw === "boolean" ? raw : undefined;
}

export class NotAdminError extends Error {
  constructor() {
    super("NOT_ADMIN");
    this.name = "NotAdminError";
  }
}

/** POST /auth/login — sets access token only if role is admin. */
export async function loginAsAdmin(email: string, password: string): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>("/auth/login", {
    email: email.trim(),
    password,
  });
  const role = String(data.user?.role ?? "").toLowerCase();
  if (role !== "admin") {
    throw new NotAdminError();
  }
  setAccessToken(readAccessToken(data));
  return apiUserToSessionWithOverrides(data.user, {
    status: data.status,
    emailVerified: readIsEmailVerified(data),
  });
}

export async function logoutAdmin(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

/** GET /profile — optional fresh user (if backend exposes it). */
export async function fetchAdminProfile(): Promise<UserSession> {
  const { data } = await http.get<ApiAuthUser | { user: ApiAuthUser; data?: ApiAuthUser }>(
    "/profile",
  );
  const raw =
    data && typeof data === "object" && "user" in data
      ? (data as { user: ApiAuthUser }).user
      : (data as ApiAuthUser);
  return apiUserToSession(raw);
}
