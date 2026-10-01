import UserAvatar from "@/components/profile/UserAvatar";
import StyledName from "@/components/profile/StyledName";
import ProfileEffect from "@/components/profile/ProfileEffect";
import ProfileFrame from "@/components/profile/ProfileFrame";
import { getBannerStyle, getSurfaceStyle } from "@/lib/profileTheme";

/**
 * Thẻ trang cá nhân cỡ lớn ở giữa trình chỉnh sửa — giống thẻ profile mà
 * Discord dùng làm bản xem trước: mọi thay đổi hiện ngay trên đó.
 */
export default function ProfilePreviewCard({
  theme,
  username,
  profileName,
  avatarUrl,
  coverUrl,
  bio,
  joinedAt,
  points,
  effectReplayKey,
}) {
  const bannerStyle = coverUrl
    ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : getBannerStyle(theme);

  return (
    <div
      className="relative w-full max-w-[440px] mx-auto rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 shadow-sm"
      style={getSurfaceStyle(theme) || undefined}
    >
      <div
        className="h-36 bg-gray-300 dark:bg-neutral-600"
        style={bannerStyle || undefined}
      />

      <div className="px-5 pb-5">
        <div className="-mt-14 mb-3">
          <UserAvatar
            username={username}
            src={avatarUrl}
            theme={theme}
            className="w-28 h-28"
            imgClassName="bg-white ring-[6px] ring-white dark:ring-neutral-800"
          />
        </div>

        <p className="font-bold text-2xl break-words">
          <StyledName theme={theme} className="text-gray-900 dark:text-white">
            {profileName}
          </StyledName>
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-400">@{username}</p>

        <dl className="mt-4 space-y-3 text-sm">
          {bio && (
            <div>
              <dt className="font-semibold text-gray-500 dark:text-neutral-400">Giới thiệu</dt>
              <dd className="mt-0.5 text-gray-800 dark:text-neutral-200 break-words whitespace-pre-line line-clamp-4">
                {bio}
              </dd>
            </div>
          )}
          <div className="flex gap-6">
            {joinedAt && (
              <div>
                <dt className="font-semibold text-gray-500 dark:text-neutral-400">Tham gia</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-neutral-200">{joinedAt}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-gray-500 dark:text-neutral-400">Điểm</dt>
              <dd className="mt-0.5 text-gray-800 dark:text-neutral-200">{points}</dd>
            </div>
          </div>
        </dl>

        {/* How the name and avatar look next to posts/comments */}
        <div className="mt-5 pt-4 border-t border-gray-200/80 dark:border-neutral-600 flex items-center gap-2.5">
          <UserAvatar
            username={username}
            src={avatarUrl}
            theme={theme}
            className="w-9 h-9"
            imgClassName="bg-white"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              <StyledName theme={theme} className="text-gray-900 dark:text-white">
                {profileName}
              </StyledName>
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Trong bình luận</p>
          </div>
        </div>
      </div>

      <ProfileEffect theme={theme} replayKey={effectReplayKey} />
      <ProfileFrame theme={theme} className="rounded-2xl" />
    </div>
  );
}
