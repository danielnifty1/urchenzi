/**
 * Store routes use a full-width shell and the in-page Glovo-style Header.
 * Navbar is hidden on `/store/*` via Navbar.tsx; this segment lives outside `(main)` so no global footer.
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex-1">{children}</div>;
}
