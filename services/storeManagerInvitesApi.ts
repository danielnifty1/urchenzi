import { http } from "@/lib/api/client";
import { apiUserToSessionWithOverrides } from "@/lib/auth/mapUser";
import { setAccessToken } from "@/lib/auth/token";
import { loginWithPassword } from "@/services/authApi";
import type { AuthLoginResponse, UserSession } from "@/types";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
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

export type InviteStoreManagerResult = {
  /** Secret token — send to the invitee out of band (e.g. email). */
  token: string;
};

/** POST /stores/:storeId/invite-manager — vendor JWT; body `{ email }`. */
export async function inviteStoreManager(storeId: string, email: string): Promise<InviteStoreManagerResult> {
  const { data } = await http.post<unknown>(
    `/stores/${encodeURIComponent(storeId)}/invite-manager`,
    { email: email.trim() },
    { skipStoreContext: true },
  );
  const raw = unwrap<Record<string, unknown>>(data);
  const token = raw.token ?? raw.inviteToken ?? raw.secret;
  if (!token || typeof token !== "string") {
    throw new Error("Invalid invite response from server.");
  }
  return { token };
}

/** POST /invites/accept — JWT; invite email must match session email. */
export async function acceptStoreManagerInvite(token: string): Promise<void> {
  await http.post(
    "/invites/accept",
    { token: token.trim() },
    { skipStoreContext: true },
  );
}

/** POST /invites/accept-signup — public; creates account and assigns store_manager for the invite. */
export async function acceptStoreManagerInviteSignup(params: {
  token: string;
  email: string;
  password: string;
}): Promise<UserSession> {
  const { data } = await http.post<AuthLoginResponse>(
    "/invites/accept-signup",
    {
      token: params.token.trim(),
      email: params.email.trim(),
      password: params.password,
    },
    { skipStoreContext: true, skipAuth: true },
  );
  const access = readAccessToken(data);
  if (access) {
    setAccessToken(access);
    return authResponseToSession(data);
  }
  // Some backends return only `{ message, user }` without JWT; sign in to obtain tokens + session.
  if (data?.user) {
    return loginWithPassword(params.email.trim(), params.password);
  }
  throw new Error("Invalid signup response from server.");
}
