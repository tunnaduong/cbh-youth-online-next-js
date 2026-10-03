// Client side of the link preview cards (see components/ui/LinkPreviewCard and
// app/api/link-preview/route.js): picks the link in a post or chat message
// worth previewing, and fetches + caches its Open Graph metadata through our
// own route - the browser can't read other sites' HTML directly (CORS).

const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const HREF_RE = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
// Sentence punctuation typed right after a link isn't part of it.
const TRAILING_PUNCTUATION = /[.,!?;:\]}>»"']+$/;
const YOUTUBE_RE = /(?:^|\.)(?:youtube\.com|youtu\.be)$/i;
const SOUNDCLOUD_RE = /(?:^|\.)soundcloud\.com$/i;
const MAX_CACHE_ENTRIES = 200;

const pending = new Map(); // url -> Promise<preview | null>
const resolved = new Map(); // url -> preview | null

function decodeAmp(value) {
  return String(value).replace(/&amp;/gi, "&").replace(/&#x2F;/gi, "/");
}

function cleanUrl(url) {
  let out = String(url || "").trim();
  for (;;) {
    const stripped = out.replace(TRAILING_PUNCTUATION, "");
    if (stripped !== out) {
      out = stripped;
      continue;
    }
    // A closing paren belongs to the URL when it balances one inside it
    // (wikipedia.org/wiki/Foo_(bar)), and to the sentence otherwise.
    if (
      out.endsWith(")") &&
      (out.match(/\(/g) || []).length < (out.match(/\)/g) || []).length
    ) {
      out = out.slice(0, -1);
      continue;
    }
    return out;
  }
}

function parseUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function isPreviewable(url) {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  // Hashtag links in post bodies are searches, not something to preview.
  if (parsed.searchParams.get("type") === "hashtag") return false;
  // These already get an inline player instead of a card.
  return !YOUTUBE_RE.test(parsed.hostname) && !SOUNDCLOUD_RE.test(parsed.hostname);
}

/**
 * Path to open in-app when the link points at our own site, else null.
 */
export function getInternalPath(url) {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (host !== "chuyenbienhoa.com") return null;
  return parsed.pathname + parsed.search + parsed.hash;
}

/** First link in plain text (chat messages) worth previewing, or null. */
export function findPreviewableUrl(text) {
  for (const match of String(text || "").matchAll(URL_RE)) {
    const url = cleanUrl(match[0]);
    if (isPreviewable(url)) return url;
  }
  return null;
}

/** First link in rendered post HTML worth previewing, or null. */
export function findPreviewableUrlInHtml(html) {
  const source = String(html || "");
  // An embedded player (YouTube/SoundCloud iframe) already shows the link.
  if (/<iframe[\s>]/i.test(source)) return null;
  for (const match of source.matchAll(HREF_RE)) {
    const url = cleanUrl(decodeAmp(match[1]));
    if (isPreviewable(url)) return url;
  }
  return findPreviewableUrl(decodeAmp(source.replace(/<[^>]*>/g, " ")));
}

/** A preview already fetched this session (null = no card), or undefined. */
export function getCachedLinkPreview(url) {
  return resolved.get(url);
}

/** Resolves to the preview for a link, or null when there's nothing to show. */
export function fetchLinkPreview(url) {
  if (resolved.has(url)) return Promise.resolve(resolved.get(url));
  if (pending.has(url)) return pending.get(url);

  const promise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => data?.preview || null)
    .catch(() => null)
    .then((preview) => {
      pending.delete(url);
      resolved.set(url, preview);
      if (resolved.size > MAX_CACHE_ENTRIES) {
        resolved.delete(resolved.keys().next().value);
      }
      return preview;
    });
  pending.set(url, promise);
  return promise;
}
