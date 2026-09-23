/**
 * Story overlays on the web.
 *
 * Stories are authored on a 9:16 canvas in the mobile app and every overlay
 * (text, sticker, mention, link, music chip) is stored normalized against that
 * canvas, so the web viewer only has to scale them back up to whatever box the
 * media actually occupies here.
 */

export const STORY_ASPECT_RATIO = 9 / 16;

/**
 * CSS equivalents of the editor's colour filters. Photos already have the
 * filter baked in when they are uploaded; this is for video stories, whose
 * media is stored untouched.
 */
export const STORY_FILTER_CSS = {
  none: "none",
  vivid: "saturate(1.45) contrast(1.12)",
  mono: "grayscale(1) contrast(1.12)",
  noir: "grayscale(1) contrast(1.45) brightness(0.92)",
  warm: "saturate(1.15) sepia(0.18)",
  cool: "saturate(1.1) hue-rotate(-10deg)",
  fade: "saturate(0.78) contrast(0.88) brightness(1.06)",
  retro: "sepia(0.4) contrast(1.08) saturate(1.1)",
  dusk: "saturate(1.2) brightness(0.95) hue-rotate(-8deg)",
};

export const getStoryFilterCss = (filterId) =>
  STORY_FILTER_CSS[filterId] || "none";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Parse the `overlays` column, which may arrive as an object or a string. */
export const parseStoryOverlays = (raw) => {
  if (!raw) return null;

  let payload = raw;

  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  if (!payload || typeof payload !== "object") return null;

  return {
    version: payload.version || 1,
    flattened: Boolean(payload.flattened),
    filter: payload.filter || "none",
    items: Array.isArray(payload.items) ? payload.items : [],
  };
};

/** Parse the `music` column into the shape the player needs. */
export const parseStoryMusic = (raw) => {
  if (!raw) return null;

  let payload = raw;

  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  if (!payload || typeof payload !== "object" || !payload.preview_url) return null;

  return {
    title: payload.title || "",
    artist: payload.artist || "",
    artworkUrl: payload.artwork_url || null,
    previewUrl: payload.preview_url,
    startMs: toNumber(payload.start_ms, 0),
    durationMs: toNumber(payload.duration_ms, 0),
  };
};

/**
 * The box a 9:16 story occupies inside `container`, matching the
 * `object-contain` the viewer renders its media with.
 */
export const getContainedStoryBox = (containerWidth, containerHeight) => {
  if (!containerWidth || !containerHeight) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  let width = containerHeight * STORY_ASPECT_RATIO;
  let height = containerHeight;

  if (width > containerWidth) {
    width = containerWidth;
    height = containerWidth / STORY_ASPECT_RATIO;
  }

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
};

/** Normalized item -> absolute pixels inside `box`. */
export const denormalizeOverlayItem = (item, box, index = 0) => {
  const base = {
    key: `${item.type}_${index}`,
    type: item.type,
    x: toNumber(item.x, 0.5) * box.width,
    y: toNumber(item.y, 0.5) * box.height,
    scale: toNumber(item.scale, 1),
    rotation: toNumber(item.rotation, 0),
    width: toNumber(item.width, 0.8) * box.width,
  };

  switch (item.type) {
    case "text":
      return {
        ...base,
        text: item.text || "",
        color: item.color || "#FFFFFF",
        font: item.font || "classic",
        effect: item.effect || "none",
        align: item.align || "center",
        fontSize: toNumber(item.fontSize, 0.08) * box.width,
      };
    case "sticker":
      return { ...base, emoji: item.emoji || "" };
    case "mention":
      return { ...base, username: item.username || "", style: item.style || "light" };
    case "link":
      return { ...base, url: item.url || "", label: item.label || "", style: item.style || "light" };
    case "music":
      return {
        ...base,
        title: item.title || "",
        artist: item.artist || "",
        artworkUrl: item.artwork_url || null,
        style: item.style || "light",
      };
    default:
      return base;
  }
};

/** Font stacks matching the editor's font picker. */
export const STORY_FONT_CSS = {
  classic: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  modern: "'Avenir Next', 'Helvetica Neue', sans-serif",
  typewriter: "'Courier New', monospace",
  serif: "Georgia, 'Times New Roman', serif",
  handwriting: "'Snell Roundhand', 'Segoe Script', cursive",
};

/** Text decoration presets matching the editor's "Aa" styles. */
export const getTextEffectStyle = (effect, color) => {
  switch (effect) {
    case "shadow":
      return { textShadow: "0 2px 6px rgba(0,0,0,0.55)" };
    case "outline":
      return { textShadow: "0 0 3px rgba(0,0,0,0.95)" };
    case "neon":
      return { textShadow: `0 0 14px ${color}` };
    default:
      return {};
  }
};
