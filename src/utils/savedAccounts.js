/**
 * Multi-account support: every account signed in on this browser is kept in
 * localStorage (token + a small user snapshot) so people can switch between
 * them without typing passwords again. The active session itself still lives
 * in the usual TOKEN / auth_token / CURRENT_USER storage.
 */
import { setAuthCookie, removeAuthCookie } from "@/utils/cookies";

const STORAGE_KEY = "SAVED_ACCOUNTS";
export const MAX_SAVED_ACCOUNTS = 5;

export function getSavedAccounts() {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list.filter((a) => a?.token && a?.user?.id) : [];
  } catch {
    return [];
  }
}

function writeSavedAccounts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_SAVED_ACCOUNTS)));
  window.dispatchEvent(new Event("saved-accounts-changed"));
}

/** Insert or refresh an account, most recently used first. */
export function upsertSavedAccount(token, user) {
  if (!token || !user?.id) return;
  const { id, username, profile_name, avatar_url } = user;
  const others = getSavedAccounts().filter((a) => a.user.id !== id && a.token !== token);
  writeSavedAccounts([{ token, user: { id, username, profile_name, avatar_url } }, ...others]);
}

export function removeSavedAccount(userId) {
  writeSavedAccounts(getSavedAccounts().filter((a) => a.user.id !== userId));
}

function clearActiveSession() {
  localStorage.removeItem("TOKEN");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("CURRENT_USER");
  removeAuthCookie();
}

/**
 * Make a saved account the active one and hard-reload so every provider
 * (chat, notifications, echo sockets...) starts clean for the new user.
 */
export function activateSavedAccount(account, redirectTo = "/") {
  clearActiveSession();
  localStorage.setItem("TOKEN", account.token);
  localStorage.setItem("CURRENT_USER", JSON.stringify(account.user));
  setAuthCookie(account.token);
  window.location.href = redirectTo;
}

/** Leave the current account signed in (kept in the list) and open the login page. */
export function startAddAccount() {
  // Save the current account explicitly before signing it out locally
  try {
    const token = localStorage.getItem("TOKEN");
    const user = JSON.parse(localStorage.getItem("CURRENT_USER") || "null");
    upsertSavedAccount(token, user);
  } catch {}
  clearActiveSession();
  window.location.href = `/login?continue=${encodeURIComponent("/")}`;
}

export { clearActiveSession };
