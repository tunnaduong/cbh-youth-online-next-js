/**
 * Cookie management utilities for authentication
 */

/**
 * Set authentication token cookie
 * @param {string} token - JWT token
 * @param {object} options - Cookie options
 */
export function setAuthCookie(token, options = {}) {
  if (typeof document === "undefined") {
    console.warn("setAuthCookie can only be called on the client side");
    return;
  }

  const defaultOptions = {
    path: "/",
    // No maxAge or expires - cookie will persist until browser is cleared
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Leading-dot domain shares this cookie with every *.chuyenbienhoa.com
    // subdomain (e.g. giftshop.chuyenbienhoa.com), letting other CBH sites
    // pick up the same login without a separate auth flow. Only applied
    // when actually running on that domain - a browser rejects (silently
    // drops, not an error) any attempt to set a cookie's domain to
    // something that isn't the current host or one of its parent domains,
    // so this would otherwise break auth entirely on localhost/other hosts.
    ...(getSharedCookieDomain() ? { domain: getSharedCookieDomain() } : {}),
    ...options,
  };

  document.cookie = `auth_token=${token}; ${Object.entries(defaultOptions)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ")}`;
}

function getSharedCookieDomain() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  return host === "chuyenbienhoa.com" || host.endsWith(".chuyenbienhoa.com")
    ? ".chuyenbienhoa.com"
    : null;
}

/**
 * Get authentication token from cookie (client-side)
 * @returns {string|null} - Token or null if not found
 */
export function getAuthCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token=")
  );

  if (authCookie) {
    return authCookie.split("=")[1];
  }

  return null;
}

/**
 * Remove authentication token cookie
 */
export function removeAuthCookie() {
  if (typeof document === "undefined") {
    console.warn("removeAuthCookie can only be called on the client side");
    return;
  }

  // Deleting a cookie requires matching domain/path, or it silently leaves
  // a differently-scoped cookie of the same name behind - clear both the
  // shared-domain version (if applicable) and the plain host-only version.
  const sharedDomain = getSharedCookieDomain();
  if (sharedDomain) {
    document.cookie = `auth_token=; path=/; domain=${sharedDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  document.cookie =
    "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * Check if user is authenticated (has valid token cookie)
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getAuthCookie();
}

/**
 * Migration helper: sync localStorage token to cookies
 * This helps with backward compatibility during migration
 */
export function migrateTokenToCookies() {
  if (typeof window === "undefined") {
    return;
  }

  const localStorageToken = localStorage.getItem("TOKEN");
  const cookieToken = getAuthCookie();

  // If we have localStorage token but no cookie token, migrate it
  if (localStorageToken && !cookieToken) {
    setAuthCookie(localStorageToken);
    console.log("Migrated token from localStorage to cookies");
  }
}

/**
 * Get token from either cookies or localStorage (for migration period)
 * @returns {string|null}
 */
export function getTokenFromAnywhere() {
  // First try cookies
  const cookieToken = getAuthCookie();
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to localStorage during migration
  if (typeof window !== "undefined") {
    return localStorage.getItem("TOKEN");
  }

  return null;
}
