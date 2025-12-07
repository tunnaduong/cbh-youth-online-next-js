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



