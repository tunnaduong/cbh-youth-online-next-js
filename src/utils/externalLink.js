// Links to other sites inside user-generated content (post bodies, comments,
// chat messages) don't go straight out to the web - they go through the
// /link/<token> interstitial first, which shows the destination in full and
// makes the user confirm. That's the only defence against a "click here to
// claim your prize" link whose visible text says one thing and whose href
// says another, since the backend's CommonMark autolinker happily renders
// any http(s) URL a member types.
//
// The destination is carried in the path as base64url rather than a plain
// ?url= query string: it keeps the raw URL out of the address bar (so the
// interstitial can't itself be mistaken for the target site), survives
// copy-paste without needing another layer of percent-encoding, and is
// reversible - which an md5 hash wouldn't be, since we have to show the
// user the actual URL they're about to visit.

// Our own domain (and its subdomains) never needs a warning.
const TRUSTED_HOST_SUFFIXES = ["chuyenbienhoa.com"];
const TRUSTED_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export const SAFE_LINK_PATH = "/link";

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
};

// Hrefs pulled out of rendered HTML still carry entity escapes (CommonMark
// writes "&" as "&amp;" in attributes), and those must be resolved before the
// URL is encoded - otherwise the interstitial would hand the browser a link
// with a literal "&amp;" in its query string.
function decodeHtmlEntities(value) {
  return String(value).replace(
    /&(?:amp|lt|gt|quot|#39|#x27|#x2F);/gi,
    (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity
  );
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function base64Encode(binary) {
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(binary, "binary").toString("base64");
}

function base64Decode(base64) {
  if (typeof atob === "function") return atob(base64);
  return Buffer.from(base64, "base64").toString("binary");
}

function utf8ToBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return base64Encode(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToUtf8(token) {
  let base64 = String(token).replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = base64Decode(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function isTrustedHost(hostname) {
  const host = String(hostname || "")
    .toLowerCase()
    .replace(/\.$/, "");
  if (!host) return false;
  if (TRUSTED_HOSTS.includes(host)) return true;
  return TRUSTED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

/**
 * Parses an href and returns a URL object only when it points somewhere the
 * user should be warned about: an absolute http(s) address on a host that
 * isn't ours. Relative paths, anchors, mailto:/tel: and anything unparseable
 * come back as null and are left alone by callers.
 */
export function parseExternalUrl(href) {
  if (!href || typeof href !== "string") return null;
  const raw = decodeHtmlEntities(href).trim();
  if (!/^https?:\/\//i.test(raw)) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (isTrustedHost(url.hostname)) return null;
  return url;
}

export function isExternalHref(href) {
  return parseExternalUrl(href) !== null;
}

export function encodeLinkToken(url) {
  return utf8ToBase64Url(String(url));
}

/**
 * Turns a token back into the URL it encodes, or null when the token is
 * malformed or doesn't decode to an http(s) address (a javascript: or data:
 * payload must never reach the "continue" button).
 */
export function decodeLinkToken(token) {
  if (!token || typeof token !== "string") return null;
  let decoded;
  try {
    decoded = base64UrlToUtf8(token);
  } catch {
    return null;
  }
  if (!/^https?:\/\//i.test(decoded.trim())) return null;
  try {
    return new URL(decoded.trim()).toString();
  } catch {
    return null;
  }
}

/** The href to use in place of `href` - unchanged when it isn't an outbound link. */
export function safeLinkHref(href) {
  const external = parseExternalUrl(href);
  if (!external) return href;
  return `${SAFE_LINK_PATH}/${encodeLinkToken(external.toString())}`;
}

/**
 * Rewrites every outbound <a href> in a block of rendered HTML to point at the
 * interstitial. Used wherever server-rendered post/comment HTML is injected
 * with dangerouslySetInnerHTML.
 */
export function rewriteExternalLinksInHtml(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(
    /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*?)>/gi,
    (match, before, _quote, href, after) => {
      const external = parseExternalUrl(href);
      if (!external) return match;
      // Drop any target/rel the renderer already set so ours is the only one.
      const attributes = `${before} ${after}`
        .replace(/\s(?:target|rel)=(["']).*?\1/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const safeHref = escapeHtmlAttribute(
        `${SAFE_LINK_PATH}/${encodeLinkToken(external.toString())}`
      );
      return `<a ${attributes ? `${attributes} ` : ""}href="${safeHref}" target="_blank" rel="noopener noreferrer nofollow">`;
    }
  );
}
