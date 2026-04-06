/** Mirror backend RBAC slugs — UI hints only; API enforces. */

export const PERMISSION_SLUGS = [
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
] as const;

export type PermissionSlug = (typeof PERMISSION_SLUGS)[number];

export const ROLE_SLUGS = [
  "super_admin",
  "store_owner",
  "store_manager",
  "staff",
  "moderator",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const ALL_PERMISSION_SLUGS: PermissionSlug[] = [...PERMISSION_SLUGS];
