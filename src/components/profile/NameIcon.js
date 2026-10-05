import { getNameIcon, getNameIconTier } from "@/lib/profileTheme";
import MemberTierBadge from "@/components/ui/MemberTierBadge";

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
 *   tier  — mốc của người dùng (id hoặc { id }) khi nó không nằm trong theme
 *
 * Không có glyph thì vẽ biểu tượng của một mốc thành viên: mốc người dùng
 * Pro đã chọn (`name_icon_tier`), mặc định là mốc họ đang đạt.
 */
export default function NameIcon({ theme, tier, className = "" }) {
  const glyph = getNameIcon(theme);
  if (!glyph) {
    const tierId = getNameIconTier(theme, tier);
    return tierId ? <MemberTierBadge tier={{ id: tierId }} className={className} /> : null;
  }

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
