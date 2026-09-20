import slugify from "@sindresorhus/slugify";

/**
 * Generate a URL-friendly slug from a Vietnamese title
 * @param {string} title - The title to convert to a slug
 * @param {Object} options - Optional configuration for slug generation
 * @returns {string} The generated slug
 */
export const generateSlug = (title) => {
  if (!title) return "untitled";

  const slug = slugify(title, {
    customReplacements: [
      ["đ", "d"],
      ["Đ", "D"],
      // Add more Vietnamese-specific replacements if needed
    ],
    lowercase: true,
    strict: true,
  });

  // If slug is empty or only contains dashes, return "untitled"
  if (!slug || slug.replace(/-/g, "") === "") {
    return "untitled";
  }

  return slug;
};

/**
 * Generate a full post URL slug with ID
 * @param {string} id - The post ID
 * @param {string} title - The post title
 * @returns {string} The generated slug with ID
 */
export const generatePostSlug = (id, title) => {
  return `${id}-${generateSlug(title)}`;
};

/**
 * Build the public URL of a post from whatever shape the API handed back.
 * Different admin endpoints name the author relation differently (`author`
 * on some, `user` on others), and anonymous posts live under the literal
 * /anonymous/ segment.
 *
 * @param {Object} topic - A topic-ish object: { id, title, anonymous, author|user }
 * @returns {string|null} The post URL, or null when there's no post to link to
 */
export const generatePostUrl = (topic) => {
  if (!topic?.id) return null;

  const username = topic.anonymous
    ? "anonymous"
    : topic.author?.username || topic.user?.username || topic.username;

  return `/${username || "anonymous"}/posts/${generatePostSlug(topic.id, topic.title)}`;
};
