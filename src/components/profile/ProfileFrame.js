import { normalizeTheme, themeColors } from "@/lib/profileTheme";

// Keeps only a `width`-wide band along the edge of the element (a border
// that can be any background, e.g. a gradient).
const borderMask = (width) => ({
  padding: width,
  WebkitMask:
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
});

/**
 * Khung trang trí quanh thẻ/ảnh bìa trang cá nhân (kiểu Profile Frame của
 * Discord). Đặt trong phần tử `relative` — khung phủ sát mép và kế thừa bo
 * góc qua `className` (vd. "rounded-2xl").
 */
export default function ProfileFrame({ theme, className = "" }) {
  const normalized = normalizeTheme(theme);
  const frame = normalized?.profile_frame || "none";
  if (frame === "none") return null;

  // The member's own image as a nine-slice border: the outer 25% of each
  // side is the border art (corners keep their shape, edges stretch) and the
  // middle is never drawn, so the frame fits a cover of any shape. Its
  // thickness follows the smaller side of the box (.profile-frame-custom).
  if (frame === "custom") {
    if (!normalized.profile_frame_url) return null;
    return (
      <span
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none z-10 [container-type:size] ${className}`}
      >
        <span
          className="profile-frame-custom absolute inset-0"
          style={{ borderImageSource: `url("${normalized.profile_frame_url}")` }}
        />
      </span>
    );
  }

  const [primary, accent] = themeColors(normalized);
  const base = `absolute inset-0 pointer-events-none z-10 ${className}`;

  if (frame === "glow") {
    return (
      <span
        aria-hidden="true"
        className={base}
        style={{
          boxShadow: `inset 0 0 0 2px ${primary}, inset 0 0 22px ${primary}99, inset 0 0 44px ${accent}55`,
        }}
      />
    );
  }

  if (frame === "gold") {
    return (
      <span aria-hidden="true" className={base}>
        <span
          className={`absolute inset-0 ${className}`}
          style={{
            ...borderMask("5px"),
            background:
              "linear-gradient(135deg, #b45309, #fde68a, #d97706, #fef3c7, #b45309)",
          }}
        />
        {/* Corner ornaments */}
        {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map(
          (position) => (
            <span
              key={position}
              className={`absolute ${position} w-3 h-3 rotate-45 border-2 border-amber-200`}
              style={{ background: "linear-gradient(135deg, #f59e0b, #fde68a)" }}
            />
          )
        )}
      </span>
    );
  }

  // neon: a spinning conic gradient, only visible along the border band.
  return (
    <span
      aria-hidden="true"
      className={`${base} overflow-hidden`}
      style={borderMask("3px")}
    >
      <span
        className="profile-frame-spin absolute left-1/2 top-1/2 aspect-square w-[200%]"
        style={{
          background: `conic-gradient(${primary}, ${accent}, #ffffff, ${primary}, ${accent}, ${primary})`,
        }}
      />
    </span>
  );
}
