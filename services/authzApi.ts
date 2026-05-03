import { http } from "@/lib/api/client";
import type { PermissionSlug, RoleSlug } from "@/lib/rbac/slugs";
import { ALL_PERMISSION_SLUGS } from "@/lib/rbac/slugs";
import axios from "axios";

/**
 * Contract: GET /api/v1/authz/me/permissions?storeId=<uuid>
 * Response: { permissions: string[], roles?: string[], isSuperAdmin?: boolean }
 */
export type MyStorePermissionsResponse = {
  /** Effective permission slugs from the API (may extend beyond the static union). */
  permissions: string[];
  roles?: RoleSlug[];
  isSuperAdmin?: boolean;
};

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function normalizePermissions(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const list = o.permissions ?? o.permissionSlugs;
  if (!Array.isArray(list)) return [];
  return list.filter((x): x is string => typeof x === "string");
}

function normalizeRoles(raw: unknown): RoleSlug[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const list = o.roles;
  if (!Array.isArray(list)) return undefined;
  return list.filter((x): x is RoleSlug => typeof x === "string");
}

/** Static fallback when the permissions endpoint is not deployed (DX only). Set NEXT_PUBLIC_RBAC_FALLBACK_ROLE. */
const FALLBACK_PERMISSIONS_BY_ROLE: Record<string, PermissionSlug[]> = {
  super_admin: [...ALL_PERMISSION_SLUGS],
  store_owner: [
    "product.create",
    "product.update",
    "product.delete",
    "product.view",
    "product.moderate",
    "order.view",
    "order.update",
    "store.manage",
    "user.manage",
    "staff.assign",
  ],
  store_manager: [
    "product.create",
    "product.update",
    "product.delete",
    "product.view",
    "order.view",
    "order.update",
    "staff.assign",
  ],
  staff: ["product.view", "order.view"],
  moderator: ["product.view", "product.moderate"],
};

/** When authz is missing or returns no rows, infer from platform JWT role (UI hints only). */
function permissionsForPlatformRole(platformUserRole?: string): MyStorePermissionsResponse | null {
  if (platformUserRole === "admin") {
    return {
      permissions: [...ALL_PERMISSION_SLUGS],
      roles: ["super_admin"],
      isSuperAdmin: true,
    };
  }
  /** Marketplace merchants use `vendor`, not `store_owner` on the session — grant store-owner caps until authz lists explicit slugs. */
  if (platformUserRole === "vendor") {
    return {
      permissions: [...FALLBACK_PERMISSIONS_BY_ROLE.store_owner],
      roles: ["store_owner"],
      isSuperAdmin: false,
    };
  }
  if (platformUserRole === "store_manager") {
    return {
      permissions: [...FALLBACK_PERMISSIONS_BY_ROLE.store_manager],
      roles: ["store_manager"],
      isSuperAdmin: false,
    };
  }
  return null;
}

function fallbackFromEnv(platformUserRole?: string): MyStorePermissionsResponse {
  const slug = process.env.NEXT_PUBLIC_RBAC_FALLBACK_ROLE?.trim();
  if (slug && FALLBACK_PERMISSIONS_BY_ROLE[slug]) {
    return {
      permissions: [...FALLBACK_PERMISSIONS_BY_ROLE[slug]],
      roles: [slug as RoleSlug],
      isSuperAdmin: slug === "super_admin",
    };
  }
  return permissionsForPlatformRole(platformUserRole) ?? { permissions: [], roles: [], isSuperAdmin: false };
}

export async function fetchMyStorePermissions(
  storeId: string,
  options?: { platformUserRole?: string },
): Promise<MyStorePermissionsResponse & { _fallback?: boolean }> {
  try {
    const { data } = await http.get("/authz/me/permissions", {
      params: { storeId },
      headers: { "x-store-id": storeId },
    });
    const body = unwrap<unknown>(data);
    if (!body || typeof body !== "object") {
      return { permissions: [], isSuperAdmin: false };
    }
    const o = body as Record<string, unknown>;
    const permissions = normalizePermissions(body);
    const roles = normalizeRoles(body);
    const isSuperAdmin = Boolean(o.isSuperAdmin ?? o.is_super_admin);
    if (permissions.length === 0 && !isSuperAdmin) {
      const inferred = permissionsForPlatformRole(options?.platformUserRole);
      if (inferred) {
        return { ...inferred, _fallback: true };
      }
    }
    return {
      permissions,
      roles,
      isSuperAdmin,
    };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const s = e.response?.status;
      if (s === 404 || s === 501) {
        return { ...fallbackFromEnv(options?.platformUserRole), _fallback: true };
      }
      if (s === 403) {
        return { permissions: [], isSuperAdmin: false };
      }
    }
    throw e;
  }
}
