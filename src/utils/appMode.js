// "App mode": the page is running inside the CBH Youth Online mobile app's
// WebView. The app opens pages with ?app=true, and its WebView also sets the
// sessionStorage flag before every load - so the mode survives in-site
// navigation (admin's client-side routing drops the query string) for the
// rest of the WebView's session. The app owns the login, theme and its own
// splash/"get the app" prompts, so in app mode the site hides its versions.

const APP_MODE_KEY = "cbh_app_mode";

/** Client-side only - always false during SSR. */
export function isInApp() {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("app") === "true") {
      sessionStorage.setItem(APP_MODE_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(APP_MODE_KEY) === "1";
  } catch {
    return false;
  }
}
