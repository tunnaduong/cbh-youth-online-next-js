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
    ...options,
  };

  document.cookie = `auth_token=${token}; ${Object.entries(defaultOptions)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ")}`;
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
