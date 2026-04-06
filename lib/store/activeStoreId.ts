/** In-memory active store UUID for `x-store-id` on store-scoped API calls. Synced from dashboard layout. */

export const ACTIVE_STORE_STORAGE_KEY = "urchenzi.activeStoreId";

let activeStoreId: string | null = null;

export function setActiveStoreId(id: string | null): void {
  activeStoreId = id;
}

export function getActiveStoreId(): string | null {
  return activeStoreId;
}

export function readStoredStoreId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_STORE_STORAGE_KEY);
  } catch {
    return null;
  }
}
