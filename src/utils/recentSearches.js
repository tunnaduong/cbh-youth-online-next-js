const RECENT_SEARCHES_KEY = "cbh_recent_searches_v1";
const MAX_RECENT_SEARCHES = 8;

export function getRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(term) {
  if (typeof window === "undefined") return [];
  const clean = (term || "").trim();
  if (!clean) return getRecentSearches();
  try {
    const prev = getRecentSearches();
    const updated = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeRecentSearch(term) {
  if (typeof window === "undefined") return [];
  try {
    const prev = getRecentSearches();
    const updated = prev.filter((t) => t.toLowerCase() !== (term || "").trim().toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
  return [];
}
