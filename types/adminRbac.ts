/** DTOs for GET/POST /admin/rbac/* — mirror Nest contract. */

export type AdminRbacStoreRow = {
  id: string;
  name: string;
  slug?: string | null;
  vendorId?: string | null;
};

export type AdminRbacUserRow = {
  id: string;
  email: string;
  name?: string | null;
};

export type AdminRbacAssignment = {
  /** Present when backend supports revoke-by-id */
  id?: string;
  storeId: string | null;
  roleSlug: string;
  storeName?: string | null;
};

export type AdminRbacAssignBody = {
  targetUserId: string;
  storeId: string | null;
  roleSlug: string;
};

export type AdminRbacRevokeBody = AdminRbacAssignBody & {
  assignmentId?: string;
};

/** GET /admin/products rows */
export type AdminCatalogProductRow = {
  id: string;
  name: string;
  price?: number;
  vendorId?: string | null;
  storeId?: string | null;
  storeName?: string | null;
};

/** GET /admin/users paginated / directory */
export type AdminUsersSearchResult = {
  items: AdminRbacUserRow[];
  total?: number;
};
