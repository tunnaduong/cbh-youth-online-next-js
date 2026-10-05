/**
 * Tuỳ chỉnh giao diện trang cá nhân (kiểu Discord Nitro / Zalo zStyle).
 *
 * API trả `profile.theme` = null (giao diện mặc định) hoặc:
 *   { primary_color, accent_color, banner_color, name_font, name_effect,
 *     name_colors, avatar_frame, profile_effect, profile_frame,
 *     name_icon, name_icon_emoji, username_style }
 * Danh sách key hợp lệ và quyền mở khoá nằm ở App\Services\ProfileThemeService
 * phía API — thêm key mới phải thêm ở cả hai (font: src/lib/nameFonts.js).
 */

export const DEFAULT_PRIMARY = "#319527";
export const DEFAULT_ACCENT = "#22d3ee";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Cách vẽ từng khung avatar:
 *   { type: "ring", gradient?, animated? } — viền vẽ bằng CSS. `gradient` là
 *       CSS background của viền (không có thì lấy màu theme của người dùng),
 *       `animated` làm viền xoay chậm.
 *   { type: "image", src, scale? }         — ảnh PNG/WebP nền trong suốt phủ
 *       lên avatar. `scale` = kích thước ảnh so với avatar; mặc định 1.25 ứng
 *       với ảnh vuông có lỗ tròn ở giữa chiếm 80% chiều rộng.
 */
export const AVATAR_FRAMES = {
  theme: { type: "ring" },
  trainee: {
    type: "ring",
    gradient: "linear-gradient(135deg, #9ca3af, #f3f4f6, #9ca3af)",
  },
  active: {
    type: "ring",
    gradient: "conic-gradient(#2563eb, #38bdf8, #a5f3fc, #38bdf8, #2563eb)",
  },
  distinguished: {
    type: "ring",
    gradient:
      "conic-gradient(#b45309, #fbbf24, #fef3c7, #f59e0b, #b45309, #fde68a, #b45309)",
  },
  veteran: {
    type: "ring",
    gradient:
      "conic-gradient(#ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)",
    animated: true,
  },
};

/** Tên hiển thị trong trình chỉnh sửa. */
export const OPTION_LABELS = {
  avatar_frame: {
    none: "Không",
    theme: "Theo màu",
    trainee: "Bạc",
    active: "Băng",
    distinguished: "Vàng",
    veteran: "Cầu vồng",
  },
  name_effect: {
    none: "Không",
    solid: "Một màu",
    gradient: "Chuyển màu",
    pop: "Nổi khối",
    toon: "Hoạt hình",
    neon: "Neon",
    rainbow: "Cầu vồng",
    outline: "Viền chữ",
  },
  profile_effect: {
    none: "Không",
    sparkles: "Lấp lánh",
    hearts: "Trái tim",
    snow: "Tuyết rơi",
    aurora: "Cực quang",
  },
  profile_frame: {
    none: "Không",
    glow: "Phát sáng",
    gold: "Viền vàng",
    neon: "Neon xoay",
  },
};

const color = (value, fallback) =>
  typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;

/**
 * Chuẩn hoá theme từ API; trả null nếu người dùng không có theme.
 */
export function normalizeTheme(theme) {
  if (!theme || typeof theme !== "object") return null;

  return {
    // null = không dùng màu giao diện (trang cá nhân giữ nguyên như cũ).
    primary_color: color(theme.primary_color, null),
    accent_color: color(theme.accent_color, null),
    banner_color: color(theme.banner_color, null),
    // Second colour of each of the three above (1500-point tier): when set,
    // that colour is drawn as a gradient. Null = solid.
    primary_color_2: color(theme.primary_color_2, null),
    accent_color_2: color(theme.accent_color_2, null),
    banner_color_2: color(theme.banner_color_2, null),
    name_font: theme.name_font || "default",
    name_effect: theme.name_effect || "none",
    name_colors: [
      color(theme.name_colors?.[0], DEFAULT_PRIMARY),
      color(theme.name_colors?.[1], DEFAULT_ACCENT),
    ],
    avatar_frame: theme.avatar_frame || "none",
    profile_effect: theme.profile_effect || "none",
    profile_frame: theme.profile_frame || "none",
    // Pro (2000 points). Older responses lack these: "none" / "default".
    name_icon: theme.name_icon || "none",
    // The glyph of name_icon, sent by the API (no glyph table on this side).
    name_icon_emoji:
      typeof theme.name_icon_emoji === "string" && theme.name_icon_emoji
        ? theme.name_icon_emoji
        : null,
    // A tier's own icon picked as the name icon ("veteran"...), and the tier
    // the member is in - whose icon is shown when they picked none.
    name_icon_tier: typeof theme.name_icon_tier === "string" ? theme.name_icon_tier : null,
    member_tier: typeof theme.member_tier === "string" ? theme.member_tier : null,
    // The @username's own style (Pro): same fonts and effects as the name,
    // chosen separately. username_style ("name" = copy the name's style) is
    // the older setting, only followed when the username has no style.
    username_font: theme.username_font || "default",
    username_effect: theme.username_effect || "none",
    username_colors: [
      color(theme.username_colors?.[0], DEFAULT_PRIMARY),
      color(theme.username_colors?.[1], DEFAULT_ACCENT),
    ],
    username_style: theme.username_style === "name" ? "name" : "default",
  };
}

/**
 * Glyph shown right after the user's name (Pro), or null. It always
 * comes from the API (`name_icon_emoji`).
 */
export function getNameIcon(theme) {
  const normalized = normalizeTheme(theme);
  if (!normalized || normalized.name_icon === "none") return null;
  return normalized.name_icon_emoji;
}

/**
 * Which tier's icon follows the name when there is no glyph: the one the
 * user picked (Pro), else the tier they are in (`fallback`: id or { id }, for
 * places where the tier comes separately from the theme, e.g. the profile).
 */
export function getNameIconTier(theme, fallback = null) {
  const normalized = normalizeTheme(theme);
  const own = typeof fallback === "string" ? fallback : fallback?.id || null;
  if (!normalized) return own;
  return normalized.name_icon_tier || normalized.member_tier || own;
}

/**
 * The theme to draw the @username with (give it to StyledName), or null for
 * a plain one. The username's own font / effect / colours are moved into the
 * name_* fields StyledName reads.
 */
export function getUsernameTheme(theme) {
  const normalized = normalizeTheme(theme);
  if (!normalized) return null;

  if (normalized.username_font !== "default" || normalized.username_effect !== "none") {
    return {
      ...normalized,
      name_font: normalized.username_font,
      name_effect: normalized.username_effect,
      name_colors: normalized.username_colors,
    };
  }

  // Saved before the username had options of its own.
  return normalized.username_style === "name" ? normalized : null;
}

/**
 * Trộn một màu hex với đen/trắng: ratio > 0 làm sáng, < 0 làm tối.
 */
export function shade(hex, ratio) {
  const target = ratio > 0 ? 255 : 0;
  const amount = Math.abs(ratio);
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (
    "#" +
    channels
      .map((c) => Math.round(c + (target - c) * amount))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * true nếu người dùng đã chọn màu giao diện (Profile Theme).
 */
export function hasThemeColors(theme) {
  const normalized = normalizeTheme(theme);
  return !!(normalized && (normalized.primary_color || normalized.accent_color));
}

/**
 * [màu chính, màu phụ], lấy màu mặc định cho màu chưa chọn.
 */
export function themeColors(theme) {
  return [
    theme?.primary_color || DEFAULT_PRIMARY,
    theme?.accent_color || DEFAULT_ACCENT,
  ];
}

/**
 * Every colour stop of the theme gradient, in order: primary (+ its second
 * colour), accent (+ its second colour). Two stops without gradient colours.
 */
export function themeStops(theme) {
  const [primary, accent] = themeColors(theme);
  return [primary, theme?.primary_color_2, accent, theme?.accent_color_2].filter(Boolean);
}

export function themeGradient(theme, angle = 135) {
  return `linear-gradient(${angle}deg, ${themeStops(theme).join(", ")})`;
}

/**
 * Nền ảnh bìa khi người dùng chưa có ảnh bìa: màu ảnh bìa (Banner Color) nếu
 * đã chọn, nếu không thì gradient màu giao diện, nếu không nữa thì null.
 */
export function getBannerStyle(theme) {
  const normalized = normalizeTheme(theme);
  if (!normalized) return null;
  if (normalized.banner_color && normalized.banner_color_2) {
    return {
      backgroundImage: `linear-gradient(135deg, ${normalized.banner_color}, ${normalized.banner_color_2})`,
    };
  }
  if (normalized.banner_color) return { backgroundColor: normalized.banner_color };
  if (hasThemeColors(normalized)) return { backgroundImage: themeGradient(normalized) };
  return null;
}

/**
 * Lớp phủ màu theme cho thẻ/khung trang cá nhân (kiểu Profile Theme của
 * Discord). Chỉ đặt `backgroundImage` bán trong suốt nên vẫn giữ được màu
 * nền sáng/tối sẵn có của phần tử bên dưới.
 */
export function getSurfaceStyle(theme) {
  if (!hasThemeColors(theme)) return null;

  const stops = themeStops(normalizeTheme(theme)).map((stop) => `${stop}33`);
  return {
    backgroundImage: `linear-gradient(135deg, ${stops.join(", ")})`,
  };
}

/**
 * Hiệu ứng tên hiển thị (kiểu Display Name Styles của Discord).
 * Trả { style, className } — className là animation định nghĩa trong
 * globals.css (tự tắt khi bật prefers-reduced-motion) — hoặc null nếu
 * không có hiệu ứng.
 *
 *   solid    — một màu
 *   gradient — chuyển giữa 2 màu, gradient trôi chậm
 *   neon     — chữ sáng, phát quang theo màu, nhấp nháy nhẹ
 *   toon     — viền đậm và bóng đổ thẳng xuống như chữ hoạt hình
 *   pop      — bóng khối lệch chéo tạo cảm giác nổi 3D
 *   rainbow  — bảy sắc cầu vồng chạy ngang chữ (không dùng màu người dùng chọn)
 *   outline  — màu chữ (màu 1) có viền quanh chữ (màu 2), cả hai tự chọn
 */
export function getNameEffect(theme) {
  const normalized = normalizeTheme(theme);
  if (!normalized) return null;

  const [first, second] = normalized.name_colors;

  switch (normalized.name_effect) {
    case "solid":
      return { style: { color: first }, className: "" };
    case "gradient":
      return {
        style: {
          backgroundImage: `linear-gradient(90deg, ${first}, ${second}, ${first})`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          // A name that wraps keeps the whole gradient on every line.
          WebkitBoxDecorationBreak: "clone",
          boxDecorationBreak: "clone",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        },
        className: "name-effect-gradient",
      };
    case "neon":
      return {
        style: {
          color: shade(first, 0.55),
          textShadow: `0 0 1px ${first}, 0 0 6px ${first}, 0 0 14px ${first}b3`,
        },
        className: "name-effect-neon",
      };
    case "toon": {
      const outline = shade(first, -0.6);
      return {
        style: {
          color: first,
          WebkitTextStroke: `0.06em ${outline}`,
          paintOrder: "stroke fill",
          textShadow: `0 0.09em 0 ${outline}`,
        },
        className: "",
      };
    }
    case "pop":
      return {
        style: {
          color: first,
          textShadow: `0.07em 0.07em 0 ${shade(first, -0.45)}`,
        },
        className: "",
      };
    case "rainbow":
      return {
        style: {
          // Starts and ends on the same colour so the loop has no seam.
          backgroundImage:
            "linear-gradient(90deg, #ff4d4d, #ff9f1a, #ffe600, #2ed573, #1e90ff, #a55eea, #ff4d4d)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          // A name that wraps keeps the whole gradient on every line.
          WebkitBoxDecorationBreak: "clone",
          boxDecorationBreak: "clone",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        },
        className: "name-effect-rainbow",
      };
    case "outline":
      return {
        style: {
          color: first,
          // Stroke is painted under the fill, so only its outer half shows.
          WebkitTextStroke: `0.12em ${second}`,
          paintOrder: "stroke fill",
        },
        className: "",
      };
    default:
      return null;
  }
}

/**
 * Cấu hình khung avatar đã gắn màu, hoặc null nếu không có khung.
 */
export function getAvatarFrame(theme) {
  const normalized = normalizeTheme(theme);
  if (!normalized) return null;

  const frame = AVATAR_FRAMES[normalized.avatar_frame];
  if (!frame) return null;

  if (frame.type === "ring") {
    return {
      type: "ring",
      background: frame.gradient || themeGradient(normalized),
      animated: !!frame.animated,
    };
  }

  return { type: "image", src: frame.src, scale: frame.scale || 1.25 };
}
