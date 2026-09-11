"use client";

import Link from "next/link";
import {
  BookOpen,
  Gamepad2,
  HeartHandshake,
  LayoutGrid,
  Lightbulb,
  Medal,
  Megaphone,
  MessageCircleWarning,
  ShoppingBag,
} from "lucide-react";
import { HomeCard, SectionHeader } from "./HomeCard";
import { formatThousands } from "./homeUtils";

const CATEGORY_STYLES = {
  "thong-bao": { icon: Megaphone, tile: "bg-[#FFF6E8] dark:bg-[#4a3b22]/60", color: "text-[#F59E0B]" },
  "hoc-tap": { icon: BookOpen, tile: "bg-[#EDF4FF] dark:bg-[#1e3a5f]/60", color: "text-[#3B82F6]" },
  "giai-tri-xa-hoi": { icon: Gamepad2, tile: "bg-[#FFF1E8] dark:bg-[#5a3320]/60", color: "text-[#F97316]" },
  "hoat-dong-ngoai-khoa": { icon: Medal, tile: "bg-[#E8F8F6] dark:bg-[#17443d]/60", color: "text-[#0D9488]" },
  "ky-nang-song": { icon: Lightbulb, tile: "bg-[#F4EFFF] dark:bg-[#3b2a5e]/60", color: "text-[#8B5CF6]" },
  "giao-luu": { icon: HeartHandshake, tile: "bg-[#FDEEF5] dark:bg-[#5a2340]/60", color: "text-[#EC4899]" },
  "mua-ban-trao-doi": { icon: ShoppingBag, tile: "bg-[#EAF7EC] dark:bg-[#23452a]/60", color: "text-[#16A34A]" },
  "gop-y-bao-loi": { icon: MessageCircleWarning, tile: "bg-[#F1F4F8] dark:bg-[#334155]/60", color: "text-[#64748B]" },
};

const FALLBACK_STYLE = { icon: LayoutGrid, tile: "bg-[#EAF7EC] dark:bg-[#23452a]/60", color: "text-primary-500" };

export default function CategoryGrid({ categories = [] }) {
  if (categories.length === 0) return null;

  return (
    <HomeCard id="danh-muc" className="scroll-mt-24 p-4 sm:p-5">
      <SectionHeader icon={LayoutGrid} title="Danh mục diễn đàn" />
      <div className="mt-4 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const style = CATEGORY_STYLES[category.slug] || FALLBACK_STYLE;
          const Icon = style.icon;
          const subforums = category.subforums || [];
          const topicCount = subforums.reduce((sum, sub) => sum + (Number(sub.topics_count) || 0), 0);

          return (
            <Link
              key={category.slug}
              href={`/forum/${category.slug}`}
              title={subforums.map((sub) => sub.name).join(", ")}
              className={`group flex items-center gap-3 rounded-xl p-3 transition hover:-translate-y-0.5 hover:shadow-md ${style.tile}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-sm dark:bg-neutral-800/70 ${style.color}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
                  {category.name}
                </span>
                <span className="block truncate text-[12px] text-gray-500 dark:text-neutral-400">
                  {formatThousands(topicCount)} bài viết · {subforums.length} chuyên mục
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </HomeCard>
  );
}
