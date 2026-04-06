/**
 * Effective permissions for the active store (from URL + StoreDashboardProvider).
 * Prefer loading from GET /authz/me/permissions?storeId= when available.
 */
export { useStoreDashboard as useStorePermissions } from "@/contexts/StoreDashboardContext";
