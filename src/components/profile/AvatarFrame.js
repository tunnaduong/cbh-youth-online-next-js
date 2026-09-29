import { getAvatarFrame } from "@/lib/profileTheme";

// Viền dày 12% bán kính, khoét rỗng phần giữa để lộ avatar.
const RING_MASK =
  "radial-gradient(farthest-side, transparent calc(88% - 1px), #000 88%)";

/**
 * Khung trang trí phủ lên avatar. Đặt bên trong một phần tử `relative` có
 * kích thước đúng bằng avatar — khung tự co giãn theo phần tử đó và tràn ra
 * ngoài một chút, nên phần tử cha không được `overflow-hidden`.
 *
 * Props:
 *   theme — `profile.theme` từ API, hoặc null
 */
export default function AvatarFrame({ theme }) {
  const frame = getAvatarFrame(theme);
  if (!frame) return null;

  if (frame.type === "ring") {
    return (
      <span
        aria-hidden="true"
        className={`absolute rounded-full pointer-events-none ${
          frame.animated ? "avatar-frame-spin" : ""
        }`}
        style={{
          inset: "-4%",
          background: frame.background,
          WebkitMask: RING_MASK,
          mask: RING_MASK,
        }}
      />
    );
  }

  const offset = `${((1 - frame.scale) / 2) * 100}%`;

  return (
    <img
      src={frame.src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="absolute max-w-none pointer-events-none select-none"
      style={{
        top: offset,
        left: offset,
        width: `${frame.scale * 100}%`,
        height: `${frame.scale * 100}%`,
      }}
    />
  );
}
