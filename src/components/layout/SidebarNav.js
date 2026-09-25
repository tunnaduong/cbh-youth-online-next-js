"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "@bprogress/next/app";
import { message } from "antd";
import {
  BookOpen,
  Bookmark,
  ChartNoAxesColumn,
  Compass,
  Gamepad2,
  Gift,
  GraduationCap,
  House,
  Moon,
  Newspaper,
  Rss,
} from "lucide-react";
import { IoLogoFacebook, IoLogoGithub } from "react-icons/io5";
import { FaDiscord } from "react-icons/fa";
import { useAuthContext } from "@/contexts/Support";
import { useTheme } from "@/contexts/themeContext";

// Main site navigation, shared by the desktop left sidebar and the mobile menu drawer.
export const MAIN_NAV_ITEMS = [
  { key: "forum", href: "/", label: "Trang chủ", Icon: House },
  { key: "feed", href: "/feed", label: "Bảng tin", Icon: Rss },
  { key: "explore", href: "/explore", label: "Khám phá", Icon: Compass },
  { key: "study", href: "/explore/study-materials", label: "Chợ tài liệu", Icon: BookOpen },
  { key: "universities", href: "/explore/universities", label: "Đại học", Icon: GraduationCap },
  { key: "game", href: "/explore/games", label: "Giải trí", Icon: Gamepad2 },
  { key: "news", href: "/youth-news", label: "Tin tức Đoàn", Icon: Newspaper },
  // NEXT_PUBLIC_GIFTSHOP_URL lets local dev point this at the giftshop app's
  // own dev server (e.g. http://localhost:3000) instead of production -
  // unset in prod, so it falls back to the real giftshop domain there.
  { key: "shop", href: process.env.NEXT_PUBLIC_GIFTSHOP_URL || "https://giftshop.chuyenbienhoa.com", label: "Gift Shop", Icon: Gift, badge: "Mới" },
  { key: "ranking", href: "/users/ranking", label: "Bảng xếp hạng", Icon: ChartNoAxesColumn },
  { key: "saved", href: "/saved", label: "Đã lưu", Icon: Bookmark },
];

const FOOTER_LINKS = [
  { href: "/help", label: "Trợ giúp" },
  { href: "/feedback", label: "Góp ý & Báo lỗi" },
  { href: "/policy/forum-rules", label: "Nội quy" },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com/cbhyouthonline", label: "Facebook", Icon: IoLogoFacebook, className: "bg-[#1877F2]" },
  { href: "https://discord.chuyenbienhoa.com", label: "Discord", Icon: FaDiscord, className: "bg-[#5865F2]" },
  { href: "https://github.com/tunnaduong/cbh-youth-online-next-js", label: "GitHub", Icon: IoLogoGithub, className: "bg-neutral-900 dark:bg-neutral-600" },
];

// The key of the main nav item that best matches a path (longest href prefix wins).
export function getActiveNavKey(pathname, items = MAIN_NAV_ITEMS) {
  let best = null;
  for (const item of items) {
    if (!item.href?.startsWith("/")) continue;
    const matches =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }
  return best?.key ?? null;
}

export default function SidebarNav({ items = MAIN_NAV_ITEMS, activeKey, onNavigate }) {
  const router = useRouter();
  const { loggedIn } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  const handleSavedClick = (e) => {
    if (!loggedIn) {
      e.preventDefault();
      message.error("Vui lòng đăng nhập để xem các bài viết đã lưu của bạn.");
      router.push(
        "/login?continue=" +
          encodeURIComponent(window.location.origin + "/saved")
      );
    }
    onNavigate?.();
  };

  const renderItem = (it, idx) => {
    if (it.type === "divider") {
      return <hr key={`hr-${idx}`} className="mx-4 my-2 border-gray-200 dark:border-neutral-600" />;
    }

    const isActive = activeKey === it.key;
    const LinkComp = it.isExternal ? "a" : Link;
    const linkProps = it.isExternal
      ? { href: it.href, target: "_blank", rel: "noopener noreferrer" }
      : { href: it.href };
    const handleClick = (e) => {
      if (it.onClick) it.onClick(e);
      else if (it.key === "saved") return handleSavedClick(e);
      onNavigate?.();
    };

    return (
      <LinkComp
        key={it.key}
        {...linkProps}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors ${
          isActive
            ? "bg-primary-500 !text-white shadow-[0_4px_12px_rgba(49,149,39,0.28)]"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
        }`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <it.Icon
            color={isActive ? "#FFFFFF" : isDark ? "#D4D4D4" : "#4B5563"}
            height="19px"
            width="19px"
          />
        </span>
        <span className="truncate">{it.label}</span>
        {it.badge && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-primary-50 text-primary-600 dark:bg-[#2b3a2a] dark:text-[#86dc7c]"
            }`}
          >
            {it.badge}
          </span>
        )}
      </LinkComp>
    );
  };

  return (
    <>
      <nav className="flex flex-col gap-1" aria-label="Menu chính">
        {items.map(renderItem)}
      </nav>

      <div className="mt-auto pt-6">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Moon className="h-[19px] w-[19px] shrink-0" />
          <span>Chế độ tối</span>
          <span className="ml-auto flex h-5 w-9 items-center rounded-full bg-gray-200 p-0.5 transition-colors dark:bg-primary-500">
            <span className="h-4 w-4 rounded-full bg-white shadow transition-transform dark:translate-x-4" />
          </span>
        </button>

        <div className="mt-4 px-4 text-[12px] leading-relaxed text-gray-500 dark:text-neutral-400">
          <p className="flex flex-wrap gap-x-2">
            {FOOTER_LINKS.map((link) =>
              link.isExternal ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 dark:hover:text-white">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} onClick={onNavigate} className="hover:text-primary-600 dark:hover:text-white">
                  {link.label}
                </Link>
              )
            )}
          </p>
          <p className="mt-2">© 2020-{new Date().getFullYear()} Diễn đàn học sinh Chuyên Biên Hòa</p>
        </div>

        <div className="mt-3 flex gap-2 px-4">
          {SOCIAL_LINKS.map(({ href, label, Icon, className }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[17px] text-white transition hover:opacity-85 ${className}`}
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
