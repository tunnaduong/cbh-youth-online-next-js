import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeCard({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component
      className={`rounded-2xl border border-[#EBEFEA] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ icon: Icon, iconClassName = "", title, href, linkLabel = "Xem tất cả", onLinkClick, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-neutral-100">
        {Icon && (
          <Icon className={`h-[18px] w-[18px] shrink-0 text-primary-500 ${iconClassName}`} strokeWidth={2.2} />
        )}
        <span className="truncate">{title}</span>
      </h2>
      {children}
      {href && (
        <Link
          href={href}
          onClick={onLinkClick}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function UserAvatar({ username, name, anonymous, src, size = 32, className = "" }) {
  const style = { width: size, height: size };

  if (anonymous || (!username && !src)) {
    return (
      <span
        style={style}
        className={`flex shrink-0 items-center justify-center rounded-full border border-[#dfe9de] bg-[#e9f1e9] text-sm font-bold text-primary-500 dark:border-neutral-500 dark:bg-[#1d281b] dark:text-neutral-300 ${className}`}
      >
        ?
      </span>
    );
  }

  return (
    <img
      src={src || `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${username}/avatar`}
      alt={`Ảnh đại diện của ${name || username}`}
      style={style}
      loading="lazy"
      className={`shrink-0 rounded-full border border-gray-100 bg-gray-200 object-cover dark:border-neutral-600 ${className}`}
    />
  );
}
