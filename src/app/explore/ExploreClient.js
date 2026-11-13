"use client";

import HomeLayout from "@/layouts/HomeLayout";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { message } from "antd";
import { SearchOutline, ArrowForward } from "react-ionicons";
import { Sparkles } from "lucide-react";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

export default function ExploreClient() {
  const features = EXPLORE_FEATURES;

  const handleFeatureClick = (e, feature) => {
    if (feature.href === "#") {
      e.preventDefault();
      message.info("Chức năng đang phát triển");
    }
  };

  // Convert features to LeftSidebar items format (using non-outline icons)
  const sidebarItems = features.map((feature) => ({
    key: feature.key,
    href: feature.href,
    label: feature.title,
    Icon: feature.sidebarIcon,
    isExternal: false,
    onClick: (e) => handleFeatureClick(e, feature),
  }));

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="home"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:py-6 md:max-w-[936px] mx-auto">
          {/* Header: title + search */}
          <div className="mb-4 md:mb-5">
            <div className="flex items-center gap-1.5 mb-3 lg:mb-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Khám phá
              </h1>
              <span className="text-base text-yellow-500">✦</span>
            </div>
            <Link
              href="/search"
              className="lg:hidden flex items-center h-11 md:h-12 px-4 rounded-full bg-white dark:bg-neutral-800 shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-neutral-700 hover:shadow-md transition-shadow"
            >
              <SearchOutline
                color="currentColor"
                width="19px"
                height="19px"
                cssClasses="text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0"
              />
              <span className="text-sm md:text-[15px] text-gray-400 truncate">
                Tìm kiếm trên diễn đàn...
              </span>
            </Link>
          </div>

          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-[20px] border border-[#D5EBD7] dark:border-[#1B472C] bg-gradient-to-br from-[#EAF8EC] to-[#E0F5E3] dark:from-[#133321] dark:to-[#0E2418] px-5 py-4 sm:px-8 sm:py-6 md:px-10 flex items-center gap-2">
            <div className="flex-1 min-w-0 z-[2]">
              <h2 className="text-[19px] leading-[25px] sm:text-2xl sm:leading-8 md:text-3xl md:leading-[2.6rem] font-extrabold text-[#0F2E1E] dark:text-gray-100">
                Chào bạn, hôm nay <br className="sm:hidden" />
                bạn muốn
              </h2>
              <div className="inline-block mt-0.5 mb-1.5">
                <span className="text-[22px] sm:text-[28px] md:text-4xl font-black text-green-600 dark:text-green-500 leading-tight">
                  làm gì...?
                </span>
                <div className="flex items-center gap-[3px] mt-0.5">
                  <span className="h-[3.5px] w-14 sm:w-[72px] rounded-sm bg-amber-500" />
                  <span className="h-[3.5px] w-[34px] sm:w-11 rounded-sm bg-green-500" />
                </div>
              </div>
              <p className="mt-1 text-[11.5px] leading-[15.5px] sm:text-sm sm:leading-5 md:text-[15px] md:leading-6 text-gray-600 dark:text-gray-400 max-w-md">
                Khám phá các tính năng, kết nối với cộng đồng và tận hưởng trải
                nghiệm tuyệt vời trên CBH Online!
              </p>
            </div>

            {/* Illustration */}
            <div className="relative flex-shrink-0 w-[125px] h-[165px] sm:w-[170px] sm:h-[210px] md:w-[200px] md:h-[240px]">
              <div className="absolute right-0 bottom-1 w-[125px] h-[125px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] rounded-full bg-green-100 dark:bg-green-500/10 opacity-85" />
              <span className="absolute top-8 left-0.5 text-[15px] font-extrabold text-green-500 z-[2]">
                ✦
              </span>
              <span className="absolute bottom-6 left-2 text-lg font-black text-green-500 z-[2]">
                +
              </span>
              <Sparkles className="absolute top-1.5 left-12 sm:left-16 w-4 h-4 sm:w-5 sm:h-5 text-green-500 z-[2]" />
              <Image
                src="/images/student_girl.png"
                alt="Học sinh"
                fill
                sizes="(min-width: 768px) 200px, (min-width: 640px) 170px, 125px"
                className="object-contain z-[1]"
                priority
              />
            </div>
          </section>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 min-[400px]:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3.5 md:mt-5">
            {features
              .filter((feature) => feature.key !== "home")
              .map((feature) => {
                const BadgeIcon = feature.badgeIcon || feature.sidebarIcon;
                const WatermarkIcon = feature.watermarkIcon || feature.icon;
                const t = feature.theme || {};
                return (
                  <Link
                    key={feature.key}
                    href={feature.href}
                    onClick={(e) => handleFeatureClick(e, feature)}
                    style={{
                      "--c": t.color,
                      "--bg": t.lightBg,
                      "--bd": t.lightBorder,
                      "--bg-d": t.darkBg,
                      "--bd-d": t.darkBorder,
                    }}
                    className="group relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[200px] md:min-h-[220px] p-2.5 sm:p-4 md:p-5 rounded-2xl border bg-[var(--bg)] border-[var(--bd)] dark:bg-[var(--bg-d)] dark:border-[var(--bd-d)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                  >
                    {/* Watermark */}
                    <div className="pointer-events-none absolute -right-2 -bottom-1.5 opacity-[0.09] dark:opacity-[0.07] text-[var(--c)] transition-transform duration-300 group-hover:scale-110">
                      <WatermarkIcon
                        color="currentColor"
                        width="64px"
                        height="64px"
                        cssClasses="!w-14 !h-14 sm:!w-20 sm:!h-20"
                      />
                    </div>

                    {/* Icon badge */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[13px] flex items-center justify-center bg-[var(--c)] shadow-sm">
                      <BadgeIcon color="#FFFFFF" width="22px" height="22px" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 mt-1.5 sm:mt-3">
                      <h3 className="text-[12.8px] leading-4 sm:text-base sm:leading-5 font-bold text-gray-900 dark:text-gray-50 mb-[3px] sm:mb-1 line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-[9.8px] leading-[13.5px] sm:text-[13px] sm:leading-[18px] text-gray-500 dark:text-gray-400 line-clamp-3">
                        {feature.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="mt-1 w-[22px] h-[22px] sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-[var(--c)] transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowForward
                        color="#FFFFFF"
                        width="14px"
                        height="14px"
                      />
                    </div>
                  </Link>
                );
              })}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
