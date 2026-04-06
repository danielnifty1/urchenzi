/**
 * Read OAuth token from the post-redirect URL (query or hash). Backends differ:
 * `accessToken`, `access_token`, `token`, or implicit-flow fragments.
 */
const TOKEN_KEYS = ["accessToken", "access_token", "token", "id_token"] as const;

export function readOAuthTokenFromLocation(href: string): string | null {
  const url = new URL(href);

  for (const key of TOKEN_KEYS) {
    const v = url.searchParams.get(key);
    if (v) return v;
  }

  const hash = url.hash?.replace(/^#/, "") ?? "";
  if (hash) {
    const hp = new URLSearchParams(hash);
    for (const key of TOKEN_KEYS) {
      const v = hp.get(key);
      if (v) return v;
    }
  }

  return null;
}

/** Remove token-related params from search and hash so the URL is clean. */
export function stripOAuthParamsFromUrl(href: string): string {
  const url = new URL(href);

  for (const key of TOKEN_KEYS) {
    url.searchParams.delete(key);
  }

  if (url.hash) {
    const hp = new URLSearchParams(url.hash.replace(/^#/, ""));
    for (const key of TOKEN_KEYS) {
      hp.delete(key);
    }
    const next = hp.toString();
    url.hash = next ? `#${next}` : "";
  }

  return url.toString();
}
