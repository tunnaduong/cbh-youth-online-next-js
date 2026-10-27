/**
 * SEO utility functions
 */

const siteURL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.chuyenbienhoa.com";

/**
 * Generate canonical URL for a page
 * @param {string} path - The path relative to the site root (e.g., "/feed", "/forum/category/subforum")
 * @returns {string} - Full canonical URL
 */
export function getCanonicalURL(path) {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteURL}${cleanPath}`;
}

/**
 * Generate metadata with canonical URL and OpenGraph URL
 * @param {object} metadata - Base metadata object
 * @param {string} path - The path relative to the site root
 * @returns {object} - Enhanced metadata with canonical and OpenGraph URLs
 */
export function enhanceMetadataWithURLs(metadata, path) {
  const canonicalURL = getCanonicalURL(path);

  return {
    ...metadata,
    alternates: {
      canonical: canonicalURL,
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonicalURL,
    },
    twitter: {
      ...metadata.twitter,
    },
  };
}




/**
 * Absolute URL of a generated share card (see src/app/api/og).
 * @param {string} path - e.g. "/post/123", "/profile/tunna"
 * @param {Record<string,string>} [query] - for /page
 */
export function getOgImageURL(path, query) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `${siteURL}/api/og${path}${qs}`;
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Apply PDF on-page SEO overrides when defined for this path.
 * @param {string} path
 * @param {{ metaTitle: string, metaDescription: string } | null} override
 * @param {object} metadata - base metadata before canonical/OG url
 */
export function applyOnPageSeoMetadata(path, override, metadata) {
  if (!override) {
    return enhanceMetadataWithURLs(metadata, path);
  }
  const title = override.metaTitle;
  const description = override.metaDescription;
  return enhanceMetadataWithURLs(
    {
      ...metadata,
      title,
      description,
      openGraph: {
        ...metadata.openGraph,
        title,
        description,
      },
      twitter: {
        ...metadata.twitter,
        title,
        description,
      },
    },
    path
  );
}
