import AvatarFrame from "@/components/profile/AvatarFrame";

/**
 * Avatar tròn kèm khung trang trí theo theme của người dùng.
 *
 * Props:
 *   username     — dùng để lấy ảnh khi không truyền `src`
 *   src          — URL ảnh (tuỳ chọn)
 *   theme        — `theme` của người dùng từ API, hoặc null
 *   className    — kích thước của avatar, vd. "w-10 h-10"
 *   imgClassName — class thêm cho thẻ <img>
 */
export default function UserAvatar({
  username,
  src,
  theme = null,
  alt,
  className = "w-10 h-10",
  imgClassName = "",
}) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <img
        src={
          src ||
          `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${username}/avatar`
        }
        alt={alt ?? `${username} avatar`}
        className={`w-full h-full rounded-full object-cover ${imgClassName}`}
      />
      <AvatarFrame theme={theme} />
    </span>
  );
}
