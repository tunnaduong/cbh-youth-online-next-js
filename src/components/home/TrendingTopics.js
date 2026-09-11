"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { HomeCard } from "./HomeCard";
import { toHashtag } from "./homeUtils";

// There is no hashtag API, so "trending" = the subforums with the most recent posts.
export default function TrendingTopics({ categories = [] }) {
  const topics = useMemo(
    () =>
      categories
        .flatMap((category) =>
          (category.subforums || []).map((subforum) => ({
            ...subforum,
            href: `/forum/${category.slug}/${subforum.slug}`,
          }))
        )
        .filter((subforum) => subforum.latest_topic?.created_at)
        .sort(
          (a, b) =>
            new Date(b.latest_topic.created_at) -
            new Date(a.latest_topic.created_at)
        )
        .slice(0, 8),
    [categories]
  );

  if (topics.length === 0) return null;

  return (
    <HomeCard className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <p className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-neutral-100">
        <Flame className="h-[18px] w-[18px] fill-orange-400 text-orange-500" />
        <span className="hidden sm:inline">Xu hướng</span>
      </p>
      {/* w-0 keeps the chip row from widening the page's min-content size */}
      <div className="scrollbar-hide flex w-0 flex-1 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)]">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={topic.href}
            title={topic.name}
            className="shrink-0 rounded-lg bg-[#F3F5F3] px-3 py-1.5 text-[13px] text-gray-600 transition hover:bg-primary-50 hover:text-primary-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-[#2b3a2a] dark:hover:text-[#86dc7c]"
          >
            {toHashtag(topic.name)}
          </Link>
        ))}
      </div>
      <a
        href="#danh-muc"
        className="hidden shrink-0 items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600 dark:text-[#6bcf60] md:inline-flex"
      >
        Xem tất cả
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </HomeCard>
  );
}
