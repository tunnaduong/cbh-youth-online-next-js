import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import net from "node:net";

// Server-side Open Graph fetcher behind LinkPreviewCard. The browser can't
// read another site's HTML (CORS), so the card asks this route instead:
// GET /api/link-preview?url=<http(s) url> -> { preview: {...} | null }.
//
// Because it fetches whatever URL a visitor hands it, it is an SSRF target:
// only http/https on the default ports, every hop of a redirect is re-checked,
// and any host that resolves to a loopback/private/link-local address is
// refused. Responses are capped in size and time, and only a handful of meta
// fields ever leave this route.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;
const MAX_URL_LENGTH = 2048;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MISS_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
// Sites serve their share tags to link-unfurling bots; a generic browser UA
// often gets a cookie wall or an empty JS shell instead.
const USER_AGENT =
  "Mozilla/5.0 (compatible; CBHYouthOnlineBot/1.0; +https://chuyenbienhoa.com) facebookexternalhit/1.1";

const cache = new Map(); // url -> { preview, expires }

function getCached(url) {
  const entry = cache.get(url);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    cache.delete(url);
    return undefined;
  }
  return entry.preview;
}

function setCached(url, preview) {
  cache.set(url, {
    preview,
    expires: Date.now() + (preview ? CACHE_TTL_MS : MISS_TTL_MS),
  });
  if (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
}

function json(preview) {
  return NextResponse.json(
    { preview },
    {
      headers: {
        "Cache-Control": preview
          ? "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400"
          : "public, max-age=600, s-maxage=600",
      },
    }
  );
}

function parseHttpUrl(value) {
  if (!value || value.length > MAX_URL_LENGTH) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  // Non-default ports are how internal services get probed.
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  url.hash = "";
  return url;
}

function isPrivateIPv4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast + reserved
  );
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (!net.isIPv6(ip)) return true;
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local
    /^fe[89ab]/.test(lower) || // link-local
    lower.startsWith("ff") || // multicast
    lower.startsWith("::ffff:") ||
    lower.startsWith("64:ff9b:") // NAT64
  );
}

async function assertPublicHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("blocked host");
  }
  const addresses = net.isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("blocked host");
  }
}

async function readLimited(response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    // Only the <head> matters; stop once it's closed or the cap is hit.
    if (received >= MAX_BYTES) break;
    if (/<\/head>/i.test(Buffer.from(value).toString("latin1"))) break;
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

async function fetchPage(startUrl, signal) {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    const response = await fetch(url, {
      redirect: "manual",
      signal,
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "User-Agent": USER_AGENT,
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      response.body?.cancel().catch(() => {});
      const next = location ? parseHttpUrl(new URL(location, url).toString()) : null;
      if (!next) return null;
      url = next;
      continue;
    }
    return { response, finalUrl: url };
  }
  return null;
}

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(value) {
  return String(value || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
      } catch {
        return entity;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

const ATTRIBUTE_RE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(ATTRIBUTE_RE)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function parseMetaTags(head) {
  const meta = {};
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const key = (attributes.property || attributes.name || attributes.itemprop || "").toLowerCase();
    const content = attributes.content;
    // First one wins - pages list the primary image before the alternates.
    if (key && content && !(key in meta)) {
      meta[key] = decodeEntities(content).trim();
    }
  }
  return meta;
}

function findLinkHref(head, relPattern) {
  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    if (attributes.href && relPattern.test(attributes.rel || "")) {
      return decodeEntities(attributes.href);
    }
  }
  return null;
}

function resolveUrl(value, baseUrl) {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("data:")) return null;
  try {
    const resolved = new URL(raw, baseUrl);
    return resolved.protocol === "http:" || resolved.protocol === "https:"
      ? resolved.toString()
      : null;
  } catch {
    return null;
  }
}

function excerpt(text, maxLength) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 1).trimEnd()}…` : flat;
}

async function loadPreview(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const page = await fetchPage(url, controller.signal);
    if (!page || !page.response.ok) return null;
    const { response, finalUrl } = page;
    const hostname = finalUrl.hostname.replace(/^www\./, "");

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.startsWith("image/")) {
      response.body?.cancel().catch(() => {});
      let name = finalUrl.pathname.split("/").pop() || hostname;
      try {
        name = decodeURIComponent(name);
      } catch {}
      return { url: url.toString(), siteName: hostname, title: name, description: "", image: finalUrl.toString(), icon: null };
    }
    if (contentType && !contentType.includes("html")) {
      response.body?.cancel().catch(() => {});
      return null;
    }

    const html = await readLimited(response);
    const headEnd = html.search(/<\/head>/i);
    const head = headEnd > 0 ? html.slice(0, headEnd) : html;
    const meta = parseMetaTags(head);

    const title =
      meta["og:title"] ||
      meta["twitter:title"] ||
      decodeEntities((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] || "").trim());
    const description =
      meta["og:description"] || meta["twitter:description"] || meta.description || "";
    const image = resolveUrl(
      meta["og:image:secure_url"] ||
        meta["og:image"] ||
        meta["og:image:url"] ||
        meta["twitter:image"] ||
        meta["twitter:image:src"] ||
        findLinkHref(head, /(^|\s)image_src(\s|$)/i),
      finalUrl
    );
    if (!title && !description && !image) return null;

    return {
      url: url.toString(),
      siteName: excerpt(meta["og:site_name"] || hostname, 80),
      title: excerpt(title, 200),
      description: excerpt(description, 200),
      image,
      icon:
        resolveUrl(
          findLinkHref(head, /(^|\s)apple-touch-icon(\s|$)/i) ||
            findLinkHref(head, /(^|\s)icon(\s|$)/i),
          finalUrl
        ) || `${finalUrl.origin}/favicon.ico`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request) {
  const url = parseHttpUrl(request.nextUrl.searchParams.get("url"));
  if (!url) {
    return NextResponse.json({ preview: null, error: "invalid url" }, { status: 400 });
  }
  const key = url.toString();
  const cached = getCached(key);
  if (cached !== undefined) return json(cached);

  const preview = await loadPreview(url).catch(() => null);
  setCached(key, preview);
  return json(preview);
}
