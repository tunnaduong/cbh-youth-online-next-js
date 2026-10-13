import { readFile } from "fs/promises";
import path from "path";

export const OG_SIZE = { width: 1200, height: 630 };

export const BRAND = "Chuyên Biên Hòa Online";
export const GREEN = "#319527";
export const GREEN_DARK = "#245c1f";
export const GREEN_SOFT = "#e3f8e0";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

const cache = {};

// Fonts and the logo ship with the repo (src/assets, public/images); the
// paths are listed in next.config.mjs (outputFileTracingIncludes) so they are
// part of the serverless bundle.
async function readAsset(...segments) {
  const key = segments.join("/");
  if (!cache[key]) {
    cache[key] = readFile(path.join(process.cwd(), ...segments));
  }
  return cache[key];
}

export async function loadFonts() {
  const [regular, bold, extra] = await Promise.all([
    readAsset("src", "assets", "fonts", "Inter-Regular.ttf"),
    readAsset("src", "assets", "fonts", "Inter-Bold.ttf"),
    readAsset("src", "assets", "fonts", "Inter-ExtraBold.ttf"),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
    { name: "Inter", data: extra, weight: 800, style: "normal" },
  ];
}

export async function loadLogo() {
  const buf = await readAsset("public", "images", "logo.png");
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Public JSON from the API (no cookies: a card must never show private data). */
export async function fetchApi(pathname) {
  const res = await fetch(`${API_URL}${pathname}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  return res.json();
}

function sniffMime(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  return null;
}

/**
 * Downloads an image and returns a data URI, or null. The renderer only
 * decodes PNG / JPEG / GIF and throws on anything else (webp, avif, a 404
 * page), which would lose the whole card - so check the bytes and fall back.
 */
export async function fetchImage(url, maxBytes = 4 * 1024 * 1024) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    // no-store: avatars can top the 2 MB data-cache limit; the card itself is
    // cached by the CDN (OG_CACHE_HEADERS).
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) return null;
    const mime = sniffMime(buf);
    if (!mime) return null;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function truncate(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export const OG_CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};
