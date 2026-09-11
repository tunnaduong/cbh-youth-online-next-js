"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "@bprogress/next/app";
import { BookOpen, CircleHelp, FileText, Gamepad2, Search } from "lucide-react";

const QUICK_ACTIONS = [
  {
    key: "create",
    label: "Bài viết mới",
    icon: FileText,
    tint: "bg-[#E8F1FF] text-[#3B82F6] dark:bg-[#1e3a5f] dark:text-[#93c5fd]",
  },
  {
    key: "study",
    label: "Tài liệu hay",
    icon: BookOpen,
    tint: "bg-[#F1EAFE] text-[#8B5CF6] dark:bg-[#3b2a5e] dark:text-[#c4b5fd]",
    href: "/explore/study-materials",
  },
  {
    key: "games",
    label: "Minigame",
    icon: Gamepad2,
    tint: "bg-[#FFEDE3] text-[#F97316] dark:bg-[#5a3320] dark:text-[#fdba74]",
    href: "/explore/games",
  },
  {
    key: "quiz",
    label: "Đố vui",
    icon: CircleHelp,
    tint: "bg-[#E1F6F1] text-[#0FA58D] dark:bg-[#17443d] dark:text-[#5eead4]",
    href: "/explore/quiz",
  },
];

export default function HomeHero({ currentUser, authLoading, onCreatePost }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const displayName = currentUser?.profile_name || currentUser?.username;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  let eyebrow = "Chào mừng bạn đến với";
  let heading = "Diễn đàn Chuyên Biên Hòa";
  if (displayName) {
    eyebrow = "Chào mừng trở lại!";
    heading = `Xin chào, ${displayName}`;
  } else if (authLoading) {
    eyebrow = "Chào mừng trở lại!";
    heading = "Xin chào";
  }

  const actionClass =
    "group flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-left shadow-[0_4px_14px_rgba(20,70,20,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(20,70,20,0.18)] dark:bg-neutral-700 sm:px-4";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E9A2A] via-[#47AE3D] to-[#8FD27B] lg:bg-none lg:bg-[#4CAB47]">
      {/* Soft decorative shapes (small screens, where the cover is hidden) */}
      <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 lg:hidden" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 lg:hidden" />

      {/* The cover's left side is plain green, made for the text to sit on. Below
          lg the hero is too narrow for the students to clear the text, so it's hidden. */}
      <Image
        src="/images/home_cover.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="(min-width: 1024px) 1240px, 100vw"
        className="pointer-events-none hidden select-none object-cover object-[right_35%] lg:block"
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-black/25 dark:block" />

      <div className="relative z-10 p-5 sm:p-7">
        <div className="max-w-[440px]">
          <p className="text-sm font-medium text-white/90">{eyebrow}</p>
          <h1 className="mt-1.5 break-words text-[26px] font-bold leading-tight text-white drop-shadow-sm sm:text-[30px]">
            {heading}{" "}
            <span role="img" aria-label="vẫy tay">
              👋
            </span>
          </h1>
          <p className="mt-2 text-[15px] text-white/90">
            Hôm nay bạn muốn khám phá điều gì?
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex items-center rounded-xl bg-white p-1.5 pl-4 shadow-[0_4px_14px_rgba(20,70,20,0.15)] dark:bg-neutral-700"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm trên diễn đàn..."
              aria-label="Tìm kiếm trên diễn đàn"
              className="min-w-0 flex-1 border-0 bg-transparent p-1 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-0 dark:!bg-transparent dark:text-neutral-100"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white transition hover:bg-primary-600"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 lg:mt-8">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, tint, href }) => {
            const content = (
              <>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="truncate text-sm font-semibold text-gray-800 dark:text-neutral-100">
                  {label}
                </span>
              </>
            );

            return href ? (
              <Link key={key} href={href} className={actionClass}>
                {content}
              </Link>
            ) : (
              <button key={key} type="button" onClick={onCreatePost} className={actionClass}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
