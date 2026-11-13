"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const sidebarItems = EXPLORE_FEATURES.map((f) => ({
  key: f.key,
  href: f.href,
  label: f.title,
  Icon: f.sidebarIcon,
  isExternal: false,
}));

// Explore layout + page title shared by the exam score lookup pages (/lookup/*).
export default function LookupShell({ title, subtitle, backHref, children }) {
  return (
    <HomeLayout
      activeNav="explore"
      activeBar="grades"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      <div className="mx-auto w-full max-w-[775px] px-3 py-6 sm:px-4">
        {backHref && (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]"
          >
            <ChevronLeft className="h-4 w-4" />
            Tra cứu điểm thi
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        <div className="mt-6 space-y-4 sm:space-y-5">{children}</div>
      </div>
    </HomeLayout>
  );
}

export function ScoreRows({ rows }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-neutral-600">
      {rows.map((row, i) => (
        <li key={`${row.label}-${i}`} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-gray-900 dark:text-neutral-100">{row.label}</p>
            {row.hint && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{row.hint}</p>}
          </div>
          <span className="flex-shrink-0 text-lg font-bold text-gray-900 dark:text-white">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export const showValue = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

export const errorText = (error, fallback) => error?.response?.data?.message || fallback;
