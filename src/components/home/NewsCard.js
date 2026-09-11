"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Megaphone } from "lucide-react";
import { getYouthNews } from "@/app/Api";
import { HomeCard, SectionHeader } from "./HomeCard";
import { formatCompact, getPostUrl } from "./homeUtils";

export default function NewsCard() {
  const [news, setNews] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getYouthNews(1)
      .then((response) => {
        if (!cancelled) setNews((response.data?.data || []).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setNews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (Array.isArray(news) && news.length === 0) return null;

  return (
    <HomeCard className="p-5">
      <SectionHeader icon={Megaphone} title="Tin tức & sự kiện" href="/youth-news" />

      <div className="mt-3 space-y-2">
        {news === null
          ? [...Array(3)].map((_, index) => (
              <div key={index} className="flex animate-pulse gap-3 rounded-xl border border-gray-100 p-2.5 dark:border-neutral-600">
                <div className="h-11 w-11 shrink-0 rounded-lg bg-gray-200 dark:bg-neutral-600" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-neutral-600" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-neutral-600" />
                </div>
              </div>
            ))
          : news.map((item) => {
              const cover = item.image_urls?.[0];
              return (
                <Link
                  key={item.id}
                  href={getPostUrl(item)}
                  className="group flex gap-3 rounded-xl border border-gray-100 p-2.5 transition hover:border-primary-200 hover:bg-primary-50/40 dark:border-neutral-600 dark:hover:border-[#3f6b3b] dark:hover:bg-[#2b3a2a]"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500 dark:bg-[#2b3a2a]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] font-medium leading-snug text-primary-600 group-hover:underline dark:text-[#86dc7c]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-neutral-400">
                      {item.created_at} · {formatCompact(item.view_count)} lượt xem
                    </span>
                  </span>
                </Link>
              );
            })}
      </div>
    </HomeCard>
  );
}
