import { http } from "@/lib/api/client";

export type ProfileUser = {
  id: string;
  userid: string;
  role: string;
  status: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

type ProfileResponse = {
  message?: string;
  user?: Partial<ProfileUser>;
};

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function nullableStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function normalizeUser(raw: Partial<ProfileUser> | undefined): ProfileUser {
  return {
    id: str(raw?.id),
    userid: str(raw?.userid),
    role: str(raw?.role),
    status: str(raw?.status),
    email: str(raw?.email),
    firstName: nullableStr(raw?.firstName),
    lastName: nullableStr(raw?.lastName),
    phone: nullableStr(raw?.phone),
    address: nullableStr(raw?.address),
    createdAt: str(raw?.createdAt),
  };
}

export async function getMyProfile(): Promise<ProfileUser> {
  const { data } = await http.get<ProfileResponse>("/profile");
  return normalizeUser(data?.user);
}
