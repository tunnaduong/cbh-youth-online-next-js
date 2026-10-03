/**
 * "Remember this device" token for two-factor login.
 *
 * Kept in a cookie rather than localStorage because the Google/Facebook
 * login finishes in a server route (src/app/login/<provider>/callback), which
 * can read cookies but not localStorage.
 */

export const TWO_FACTOR_DEVICE_COOKIE = "tf_device";

// Short-lived cookie the OAuth callback uses to hand a pending two-factor
// challenge over to the login page.
export const TWO_FACTOR_CHALLENGE_COOKIE = "two_factor_challenge";

// Matches the server-side lifetime of a trusted device (60 days).
const DEVICE_MAX_AGE = 60 * 60 * 24 * 60;

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function secureFlag() {
  return typeof location !== "undefined" && location.protocol === "https:"
    ? "; Secure"
    : "";
}

export function getTwoFactorDeviceToken() {
  return readCookie(TWO_FACTOR_DEVICE_COOKIE) || null;
}

export function setTwoFactorDeviceToken(token) {
  if (typeof document === "undefined" || !token) return;
  document.cookie =
    `${TWO_FACTOR_DEVICE_COOKIE}=${encodeURIComponent(token)}; path=/; ` +
    `max-age=${DEVICE_MAX_AGE}; SameSite=Lax${secureFlag()}`;
}

/**
 * Read (and clear) the challenge the OAuth callback left for the login page.
 * Returns { challenge_token, method, email } or null.
 */
export function takeTwoFactorChallengeCookie() {
  const raw = readCookie(TWO_FACTOR_CHALLENGE_COOKIE);
  if (!raw) return null;

  document.cookie = `${TWO_FACTOR_CHALLENGE_COOKIE}=; Max-Age=0; path=/; SameSite=Lax${secureFlag()}`;

  try {
    const json = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);
    return parsed?.challenge_token ? parsed : null;
  } catch {
    return null;
  }
}
