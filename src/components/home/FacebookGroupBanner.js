"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { HomeCard } from "./HomeCard";

const GROUP_URL = "https://www.facebook.com/groups/cbhonline";
const DISMISS_KEY = "cbh_fb_group_banner_dismissed";

function FacebookLogo({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.57-.14-2.88-.14C11.9 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

export default function FacebookGroupBanner() {
  // Hidden until mounted so the server render matches and a dismissed banner never flashes.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}
    setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  if (!visible) return null;

  return (
    <HomeCard className="p-2 sm:p-2.5">
      <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 py-3 pl-3 pr-11 dark:border-neutral-600 dark:bg-neutral-800 sm:gap-4 sm:py-3.5 sm:pl-3.5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white sm:h-12 sm:w-12">
          <FacebookLogo className="h-7 w-7" />
        </span>
        <p className="min-w-0 text-sm text-gray-700 dark:text-gray-300 sm:text-[15px]">
          Cùng tham gia <span className="font-semibold text-primary-500 dark:text-[#6bcf60]">nhóm</span> của{" "}
          <span className="font-semibold text-gray-900 dark:text-white">CBH Youth Online</span> trên Facebook{" "}
          <a
            href={GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-primary-500 transition-colors hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]"
          >
            facebook.com/groups/cbhonline
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </HomeCard>
  );
}
