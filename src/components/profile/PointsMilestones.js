import { Check, Lock } from "lucide-react";
import MemberTierBadge from "@/components/ui/MemberTierBadge";
import UserAvatar from "@/components/profile/UserAvatar";
import StyledName from "@/components/profile/StyledName";
import ProfileFrame from "@/components/profile/ProfileFrame";
import { NAME_FONTS } from "@/lib/nameFonts";
import { OPTION_LABELS, themeGradient } from "@/lib/profileTheme";

const GROUP_LABELS = {
  name_font: "Phông",
  name_effect: "Hiệu ứng tên",
  avatar_frame: "Khung avatar",
  profile_effect: "Hiệu ứng hồ sơ",
  profile_frame: "Khung hồ sơ",
  name_icon: "Biểu tượng tên",
  username_style: "Tên người dùng",
};

const EFFECT_SYMBOLS = { sparkles: "✦", hearts: "♥", snow: "❄", aurora: "✺" };

// `fallback` is the label the API sends for server-hosted fonts.
const optionLabel = (field, key, fallback) =>
  field === "name_font"
    ? NAME_FONTS[key]?.label || fallback || key
    : OPTION_LABELS[field]?.[key] || fallback || key;

/**
 * Where `points` sits on the milestone track, in %. Milestones are evenly
 * spaced (not to scale) so 50 and 150 don't get squashed next to 1000.
 */
function trackPosition(points, tiers) {
  const stops = [0, ...tiers.map((tier) => tier.min_points)];
  const step = 100 / (stops.length - 1);
  for (let i = 1; i < stops.length; i++) {
    if (points < stops[i]) {
      return (i - 1 + (points - stops[i - 1]) / (stops[i] - stops[i - 1])) * step;
    }
  }
  return 100;
}

// Small visual sample of one unlockable option.
function Sample({ item, theme, username, avatarUrl }) {
  const { field, key } = item;

  if (field === "avatar_frame") {
    return (
      <UserAvatar
        username={username}
        src={avatarUrl}
        theme={{ ...theme, avatar_frame: key }}
        className="w-7 h-7"
        imgClassName="bg-white"
      />
    );
  }
  if (field === "name_font" || field === "name_effect") {
    return (
      <StyledName
        theme={field === "name_font" ? { ...theme, name_font: key, name_effect: "none" } : { ...theme, name_effect: key }}
        className="text-base font-bold text-gray-900 dark:text-white"
      >
        Aa
      </StyledName>
    );
  }
  if (field === "profile_effect") {
    return (
      <span className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 text-base text-white">
        {EFFECT_SYMBOLS[key] || "✦"}
      </span>
    );
  }
  if (field === "profile_frame") {
    return (
      <span className="relative block h-6 w-8 rounded bg-gray-200 dark:bg-neutral-600">
        <ProfileFrame theme={{ ...theme, profile_frame: key }} className="rounded" />
      </span>
    );
  }
  if (field === "name_icon") {
    // A tier's own icon, or a glyph from the API's option list.
    if (item.tier) return <MemberTierBadge tier={{ id: item.tier }} className="!ml-0" />;
    return (
      <span aria-hidden="true" className="text-lg leading-none">
        {item.icon}
      </span>
    );
  }
  if (field === "username_style") {
    return (
      <StyledName theme={theme} className="text-base font-bold text-gray-900 dark:text-white">
        @
      </StyledName>
    );
  }
  if (field === "fancy_name") {
    return (
      <span aria-hidden="true" className="text-sm font-bold leading-none text-gray-700 dark:text-neutral-200">
        𝓐✨
      </span>
    );
  }
  if (field === "theme_colors") {
    return <span className="block h-full w-full rounded-lg" style={{ backgroundImage: themeGradient(theme) }} />;
  }
  // animated avatar
  return <span className="text-[11px] font-bold tracking-wide text-gray-700 dark:text-neutral-200">GIF</span>;
}

/**
 * "Mốc điểm" beside the live preview: a milestone track showing where the
 * user is, and for each tier a row of small samples of what it unlocks.
 * Clicking a sample tries that option on the preview.
 *
 * Props:
 *   editor  — theme_editor from the API
 *   theme   — the current draft (samples are drawn with the user's colors)
 *   onTry(field, key)
 */
export default function PointsMilestones({ editor, theme, username, avatarUrl, onTry }) {
  const points = editor.current_points;
  const next = editor.tiers.find((tier) => !tier.reached);
  const position = trackPosition(points, editor.tiers);

  const unlocksAt = (minPoints) => {
    const items = [];
    if (editor.required_points === minPoints) {
      items.push({ field: "theme_colors", key: "colors", label: "Màu giao diện & màu ảnh bìa" });
    }
    Object.entries(editor.options).forEach(([field, options]) => {
      options
        .filter((o) => o.required_points === minPoints && !["none", "default"].includes(o.key))
        .forEach((o) =>
          items.push({
            field,
            key: o.key,
            icon: o.icon,
            tier: o.tier,
            label: `${GROUP_LABELS[field] || field}: ${optionLabel(field, o.key, o.label || o.icon)}`,
          })
        );
    });
    if (editor.fancy_name?.required_points === minPoints) {
      items.push({
        field: "fancy_name",
        key: "fancy",
        label: "Biểu tượng cảm xúc và ký tự đặc biệt trong tên hiển thị",
      });
    }
    if (editor.animated_avatar.required_points === minPoints) {
      items.push({ field: "animated_avatar", key: "gif", label: "Avatar GIF động" });
    }
    return items;
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Mốc điểm</h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          <span className="text-2xl font-bold text-primary-500">{points}</span> điểm
        </p>
      </div>

      {/* Milestone track */}
      <div className="relative mt-6 mb-2 px-3">
        <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-neutral-600">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
            style={{ width: `${position}%` }}
          />
          {editor.tiers.map((tier, i) => (
            <span
              key={tier.id}
              title={`${tier.name} · ${tier.min_points} điểm`}
              className={`absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-base ${
                tier.reached
                  ? "border-primary-500 bg-white dark:bg-neutral-800"
                  : "border-gray-300 bg-gray-100 grayscale dark:border-neutral-500 dark:bg-neutral-700"
              }`}
              style={{ left: `${((i + 1) / editor.tiers.length) * 100}%` }}
            >
              <MemberTierBadge tier={{ id: tier.id }} className="!ml-0" />
            </span>
          ))}
        </div>
        <div className="relative mt-5 h-4 text-[11px] font-medium text-gray-500 dark:text-neutral-400">
          {editor.tiers.map((tier, i) => (
            <span
              key={tier.id}
              className="absolute -translate-x-1/2"
              style={{ left: `${((i + 1) / editor.tiers.length) * 100}%` }}
            >
              {tier.min_points}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-neutral-400">
        {next ? (
          <>
            Còn <b className="text-gray-800 dark:text-neutral-200">{next.min_points - points} điểm</b> tới {next.name}
          </>
        ) : (
          "Đã mở khóa tất cả"
        )}
      </p>

      {/* What each tier unlocks */}
      <ol className="mt-5 space-y-3">
        {editor.tiers.map((tier) => {
          const items = unlocksAt(tier.min_points);
          return (
            <li
              key={tier.id}
              className={`rounded-xl border p-3 ${
                tier.reached
                  ? "border-primary-500/40 bg-[#f3f9f2] dark:bg-[#1d281b]"
                  : "border-gray-200 dark:border-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
                  <MemberTierBadge tier={{ id: tier.id }} className="!ml-0" />
                  <span className="truncate">{tier.name}</span>
                </p>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    tier.reached
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {tier.reached ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {tier.min_points}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {items.map((item) => {
                  const tryable = item.field in GROUP_LABELS;
                  return (
                    <button
                      key={`${item.field}-${item.key}`}
                      type="button"
                      title={item.label}
                      aria-label={item.label}
                      disabled={!tryable}
                      onClick={() => tryable && onTry?.(item.field, item.key)}
                      className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-700 ${
                        tryable ? "hover:ring-2 hover:ring-primary-500" : "cursor-default"
                      } ${tier.reached ? "" : "opacity-70"}`}
                    >
                      <Sample item={item} theme={theme} username={username} avatarUrl={avatarUrl} />
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
