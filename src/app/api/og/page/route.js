import {
  OG_SIZE,
  OG_CACHE_HEADERS,
  loadFonts,
  loadLogo,
  truncate,
} from "@/lib/og/shared";
import { renderFallbackCard } from "@/lib/og/fallback";

export const runtime = "nodejs";

/**
 * Generic card for pages without their own: /api/og/page?title=&description=&label=
 * The text is cut to a fixed length; nothing else is read from the query.
 */
export async function GET(request) {
  const q = new URL(request.url).searchParams;
  const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);
  const title = truncate(q.get("title"), 80) || undefined;
  const description = truncate(q.get("description"), 180) || undefined;
  const label = truncate(q.get("label"), 24) || undefined;

  return renderFallbackCard({
    logo,
    options: { ...OG_SIZE, fonts, headers: OG_CACHE_HEADERS },
    label,
    title,
    description,
  });
}
