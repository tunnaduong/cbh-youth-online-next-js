import { generatePostSlug } from "@/utils/slugify";

export const getPostUrl = (post) =>
  `/${
    post.anonymous ? "anonymous" : post.author?.username || "anonymous"
  }/posts/${generatePostSlug(post.id, post.title)}`;

export const getAvatarUrl = (username) =>
  `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${username}/avatar`;

// Plain-text excerpt from the HTML the topics API returns. Regex-based (not
// DOMParser) so the server render and the client hydration produce the same text.
export function htmlToText(html) {
  if (!html) return "";
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// 1234 -> "1.2K". Kept locale-free so server and client output match.
export function formatCompact(value) {
  const num = Number(value) || 0;
  if (num < 1000) return String(num);
  if (num < 1_000_000) {
    return `${(num / 1000).toFixed(num < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  }
  return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

// 11231 -> "11.231" (Vietnamese thousands separator).
export function formatThousands(value) {
  return String(Number(value) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// The topics API sends comment counts pre-rounded as strings like "05+".
export function parseCommentCount(value) {
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? 0 : num;
}

export function formatCommentCount(value) {
  if (typeof value === "number") return formatCompact(value);
  const num = parseCommentCount(value);
  return String(value ?? "").includes("+") && num > 0 ? `${num}+` : String(num);
}

export const getVoteScore = (post) =>
  post.votes?.reduce((sum, vote) => sum + (vote.vote_value || 0), 0) || 0;

export const getLikeCount = (post) =>
  post.votes?.filter((vote) => vote.vote_value > 0).length || 0;

// Short label describing what kind of content a post carries.
export function getPostKind(post) {
  if (post.document_urls?.length) return "Tài liệu";
  if (post.video_urls?.length) return "Video";
  if (post.image_urls?.length > 1) return "Album ảnh";
  if (post.image_urls?.length) return "Hình ảnh";
  return "Thảo luận";
}

// Pick the most engaged posts out of a pool of recent ones, preferring
// posts that have a cover image so the featured cards have something to show.
export function pickFeaturedPosts(posts, count = 3) {
  const seen = new Set();
  return posts
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .map((post) => ({
      post,
      score:
        getVoteScore(post) * 3 +
        parseCommentCount(post.comments) * 2 +
        (Number(post.views) || 0) / 20 +
        (post.image_urls?.length ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ post }) => post);
}

// "Thư giãn - Đố vui" -> "#ThưGiãnĐốVui"
export function toHashtag(name) {
  return (
    "#" +
    name
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")
  );
}
