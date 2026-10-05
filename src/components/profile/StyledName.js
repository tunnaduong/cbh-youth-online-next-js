import { getNameEffect, normalizeTheme } from "@/lib/profileTheme";
import { getNameFontClass } from "@/lib/nameFonts";

// One emoji as the user sees it: a pictograph with its variation selector,
// skin tone and ZWJ parts, or a flag (two regional indicators).
const EMOJI =
  /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*|[\u{1F1E6}-\u{1F1FF}]{2})/u;

// Effects that paint the text through `background-clip: text` make the glyphs
// themselves transparent - which turns an emoji in the name into a
// gradient-coloured silhouette. Emoji get their own span that paints normally
// (it sets a real text colour through its class; the fill then follows it).
const EMOJI_STYLE = {
  WebkitTextFillColor: "currentcolor",
  WebkitTextStroke: "0",
  textShadow: "none",
};

function withPlainEmoji(children) {
  if (typeof children !== "string" || !EMOJI.test(children)) return children;

  return children.split(EMOJI).map((part, index) =>
    // split() with one capture group: odd indexes are the emoji.
    index % 2 === 1 ? (
      <span key={index} className="text-gray-900 dark:text-white" style={EMOJI_STYLE}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

/**
 * Tên hiển thị theo kiểu tên (phông + hiệu ứng) trong theme của người dùng.
 * Không có theme thì hiển thị như một <span> bình thường.
 *
 * Hiệu ứng (một màu, chuyển màu, cầu vồng, viền chữ, neon...) luôn hiện ở
 * mọi nơi - bài viết, bình luận, thẻ, danh sách - chứ không chờ rê chuột.
 *
 * Props:
 *   theme   — `theme` của người dùng từ API, hoặc null
 *   variant — "full" | "compact": giữ lại cho các nơi đang truyền; cả hai
 *             hiện giống nhau (trước đây "compact" chỉ hiện hiệu ứng khi rê
 *             chuột, nên tên trong bài viết/bình luận trông như không có
 *             hiệu ứng).
 */
export default function StyledName({ theme, className = "", children }) {
  const normalized = normalizeTheme(theme);

  if (!normalized) {
    return <span className={className}>{children}</span>;
  }

  const effect = getNameEffect(normalized);
  const classes = [className, getNameFontClass(normalized.name_font), effect?.className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={effect?.style}>
      {effect ? withPlainEmoji(children) : children}
    </span>
  );
}
