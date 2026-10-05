import { getNameIcon } from "@/lib/profileTheme";

/**
 * Biểu tượng nhỏ ngay sau tên người dùng (mốc Pro, 2000 điểm). Glyph do
 * API gửi trong theme (`name_icon_emoji`); không có thì không vẽ gì.
 *
 * Cỡ theo chữ xung quanh (1em), không co lại trong hàng flex, và chỉ để
 * trang trí (aria-hidden). Cố ý KHÔNG có nền/viền/màu xanh để không bao giờ
 * giống tích xác minh. Phải là anh em của tên chứ không nằm trong
 * `StyledName`: hiệu ứng gradient làm chữ bên trong trong suốt.
 *
 * Props:
 *   theme — `profile_theme` của người dùng từ API, hoặc null
 */
export default function NameIcon({ theme, className = "" }) {
  const glyph = getNameIcon(theme);
  if (!glyph) return null;

  return (
    <span
      aria-hidden="true"
      className={`ml-1 inline-block flex-shrink-0 select-none font-normal not-italic leading-none ${className}`}
      style={{ fontSize: "1em" }}
    >
      {glyph}
    </span>
  );
}
