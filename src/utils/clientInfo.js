/**
 * Describes this browser to the API, which shows it in the user's
 * "logged-in devices" list (Settings > Account).
 */

import { isSessionFromApp } from "@/utils/cookies";

// The mobile app's WebViews append this to their user agent.
const APP_WEBVIEW_UA = /CBHYouthApp\//;

const BROWSERS = [
  // Order matters: most of these also contain "Chrome" and "Safari".
  ["Edge", /Edg(?:e|A|iOS)?\/(\d+)/],
  ["Opera", /OPR\/(\d+)/],
  ["Cốc Cốc", /coc_coc_browser\/(\d+)/],
  ["Samsung Internet", /SamsungBrowser\/(\d+)/],
  ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
  ["Chrome", /(?:Chrome|CriOS)\/(\d+)/],
  ["Safari", /Version\/(\d+).*Safari/],
];

function detectOs(ua) {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "";
}

function detectBrowser(ua) {
  for (const [name, pattern] of BROWSERS) {
    const match = ua.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "";
}

/**
 * The headers describing a browser, from its user agent string. Values are
 * URL-encoded because HTTP headers can't carry non-ASCII text (the API
 * decodes them).
 */
export function clientHeadersFromUserAgent(ua = "", { fromApp = false } = {}) {
  const headers = {
    "X-Client-Platform": "web",
  };

  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const os = detectOs(ua);
  const browser = detectBrowser(ua);

  if (version) headers["X-Client-Version"] = encodeURIComponent(version);
  if (os) headers["X-Device-Name"] = encodeURIComponent(os);
  // Sessions the mobile app created are labelled as such, so they can't be
  // mistaken for the user signing in on the web themselves: the app's own
  // WebView (gift shop, admin, games), or a browser the app opened and
  // signed in (/auth/set-token?code=).
  let model = browser;
  if (APP_WEBVIEW_UA.test(ua)) {
    model = "WebView trong ứng dụng CBH Youth";
  } else if (fromApp) {
    model = browser ? `${browser} · mở từ ứng dụng` : "Mở từ ứng dụng CBH Youth";
  }
  if (model) headers["X-Device-Model"] = encodeURIComponent(model);

  return headers;
}

const cached = {};

/**
 * Headers sent with every API request made from the browser.
 */
export function getClientHeaders() {
  if (typeof navigator === "undefined") return {};
  // Whether the session came from the app can change mid-visit (set-token),
  // so it's checked on every call; the user agent part is cached per value.
  const fromApp = isSessionFromApp();
  const key = fromApp ? "app" : "web";
  if (!cached[key]) {
    cached[key] = clientHeadersFromUserAgent(navigator.userAgent || "", { fromApp });
  }
  return cached[key];
}
