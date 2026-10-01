import AvatarFrame from "@/components/profile/AvatarFrame";

/**
 * Bọc một avatar có sẵn (vd. `Avatar` của ui/avatar, vốn `overflow-hidden`
 * nên không thể chứa khung bên trong) để vẽ khung trang trí bên ngoài nó.
 * Các class bố cục (margin, self-*, flex-shrink...) nên đặt lên `className`
 * của wrapper thay vì lên avatar, để khung ôm đúng kích thước avatar.
 *
 * Props:
 *   theme — `profile_theme` của người dùng từ API, hoặc null
 */
export default function AvatarFrameWrap({ theme, className = "", children }) {
  return (
    <span className={`relative inline-flex shrink-0 rounded-full ${className}`}>
      {children}
      <AvatarFrame theme={theme} />
    </span>
  );
}
