/**
 * Inline SVG badge cho từng mốc thành viên.
 * Dùng giống VerifiedBadge — chèn ngay sau tên người dùng.
 *
 * Props:
 *   tier  — object { id, name } từ API member_tier, hoặc null
 *   className — tuỳ chỉnh thêm
 */

const TIER_CONFIG = {
  trainee: {
    label: "Thành viên tập sự",
    icon: (
      // Ngôi sao viền - mốc đầu tiên
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-neutral-700",
  },
  active: {
    label: "Thành viên tích cực",
    icon: (
      // Bolt / sét - năng động
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  distinguished: {
    label: "Thành viên tiêu biểu",
    icon: (
      // Trophy
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v1a2 2 0 001 1.732V8a5 5 0 004 4.9V14H7a1 1 0 000 2h6a1 1 0 000-2h-1v-1.1A5 5 0 0016 8V7.732A2 2 0 0017 6V5a2 2 0 00-2-2H5zm9 2H6v1a3 3 0 006 0V5zm2 0v1a1 1 0 01-1 .732V8a3 3 0 01-.184 1.042A2 2 0 0016 8V7.732A2 2 0 0016 7V5zm-12 0v1a1 1 0 001 .732V8a3 3 0 00.184 1.042A2 2 0 014 8V7.732A2 2 0 014 7V5z" clipRule="evenodd" />
      </svg>
    ),
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
  },
  veteran: {
    label: "Thành viên kỳ cựu",
    icon: (
      // Shield / khiên
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/30",
  },
  premium: {
    label: "Thành viên cao cấp",
    icon: (
      // Diamond / kim cương
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path d="M5.5 3h9a1 1 0 01.8.4l2.5 3.33a1 1 0 01-.05 1.26l-7 8a1 1 0 01-1.5 0l-7-8a1 1 0 01-.05-1.26L4.7 3.4A1 1 0 015.5 3zm.5 2L4.5 7h3.1l.9-2H6zm4.7 0l.9 2h-3.2l.9-2h1.4zm3.3 0h-2.5l.9 2h3.1L14 5zm.9 4h-2.6L10 14.2 14.9 9zM7.7 9H5.1L10 14.2 7.7 9z" />
      </svg>
    ),
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/30",
  },
  pro: {
    label: "Thành viên Pro",
    icon: (
      // Crown / vương miện
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="tier-badge__icon">
        <path d="M2.2 6.3a.8.8 0 011.3-.6l3.3 2.7 2.5-4.2a.8.8 0 011.4 0l2.5 4.2 3.3-2.7a.8.8 0 011.3.6l-1.3 7.4a1 1 0 01-1 .8H4.5a1 1 0 01-1-.8L2.2 6.3zM5 16h10a.75.75 0 010 1.5H5A.75.75 0 015 16z" />
      </svg>
    ),
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
  },
};

export default function MemberTierBadge({ tier, className = "" }) {
  if (!tier) return null;
  const config = TIER_CONFIG[tier.id];
  if (!config) return null;

  return (
    <span
      title={config.label}
      className={`inline-flex items-center shrink-0 ml-0.5 ${config.color} ${className}`}
      style={{ fontSize: "1em", lineHeight: 1 }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{ width: "1em", height: "1em" }}
      >
        {config.icon}
      </span>
    </span>
  );
}
