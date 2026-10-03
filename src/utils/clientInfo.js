/**
 * Describes this browser to the API, which shows it in the user's
 * "logged-in devices" list (Settings > Account).
 */

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
export function clientHeadersFromUserAgent(ua = "") {
  const headers = {
    "X-Client-Platform": "web",
  };

  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const os = detectOs(ua);
  const browser = detectBrowser(ua);

  if (version) headers["X-Client-Version"] = encodeURIComponent(version);
  if (os) headers["X-Device-Name"] = encodeURIComponent(os);
  if (browser) headers["X-Device-Model"] = encodeURIComponent(browser);

  return headers;
}

let cached = null;

/**
 * Headers sent with every API request made from the browser.
 */
export function getClientHeaders() {
  if (typeof navigator === "undefined") return {};
  if (!cached) cached = clientHeadersFromUserAgent(navigator.userAgent || "");
  return cached;
}
