// "App mode": the page is running inside the CBH Youth Online mobile app's
// WebView. The app opens pages with ?app=true, and its WebView also sets the
// sessionStorage flag before every load - so the mode survives in-site
// navigation (admin's client-side routing drops the query string) for the
// rest of the WebView's session. The app owns the login, theme and its own
// splash/"get the app" prompts, so in app mode the site hides its versions.

const APP_MODE_KEY = "cbh_app_mode";
const CHAT_LITE_KEY = "cbh_chat_lite";

/** Client-side only - always false during SSR. */
export function isInApp() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("app") === "true" || params.get("chat_lite") === "true") {
      sessionStorage.setItem(APP_MODE_KEY, "1");
      if (params.get("chat_lite") === "true") {
        sessionStorage.setItem(CHAT_LITE_KEY, "1");
      }
      return true;
    }
    return sessionStorage.getItem(APP_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Check if running in Chat Lite full-screen WebView mode. */
export function isChatLite() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat_lite") === "true") {
      sessionStorage.setItem(CHAT_LITE_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(CHAT_LITE_KEY) === "1";
  } catch {
    return false;
  }
}
