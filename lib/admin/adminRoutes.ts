/** True when path is /admin/<uuid>/... (vendor workspace), not /admin or /admin/vendor. */
export function isAdminVendorWorkspacePath(pathname: string): boolean {
  return /^\/admin\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/i.test(
    pathname,
  );
}
