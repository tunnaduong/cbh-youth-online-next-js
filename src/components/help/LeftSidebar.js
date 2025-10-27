"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { helpArticles } from "@/data/helpArticles";
import {
  HiBookOpen,
  HiChevronRight,
  HiNewspaper,
  HiBriefcase,
  HiQuestionMarkCircle,
} from "react-icons/hi";
import { HiEnvelope, HiMegaphone } from "react-icons/hi2";

const iconMap = {
  "cai-dat-tai-khoan": (
    <HiQuestionMarkCircle className="h-5 w-5 mr-3 text-gray-500" />
  ),
  "dang-nhap-va-mat-khau": (
    <HiQuestionMarkCircle className="h-5 w-5 mr-3 text-gray-500" />
  ),
  "gioi-thieu": <HiBookOpen className="h-5 w-5 mr-3 text-gray-500" />,
  "viec-lam": <HiBriefcase className="h-5 w-5 mr-3 text-gray-500" />,
  "quang-cao": <HiMegaphone className="h-5 w-5 mr-3 text-gray-500" />,
  "lien-he": <HiEnvelope className="h-5 w-5 mr-3 text-gray-500" />,
};

export default function LeftSidebar() {
  const router = useRouter();
  const { categorySlug } = router.query || {};

  const mainTopics = helpArticles.map((topic) => ({
    name: topic.category,
    slug: topic.slug,
    href: `/help/${topic.slug}/${topic.articles[0].slug}`,
    icon: iconMap[topic.slug] || (
      <HiNewspaper className="h-5 w-5 mr-3 text-gray-500" />
    ),
  }));

  const staticPages = [
    { name: "Giới thiệu", href: "/about", slug: "about" },
    { name: "Việc làm", href: "/jobs", slug: "jobs" },
    { name: "Quảng cáo", href: "/ads", slug: "ads" },
    { name: "Liên hệ", href: "/contact", slug: "contact" },
    { name: "Điều khoản sử dụng", href: "/policy/terms", slug: "terms" },
    { name: "Chính sách bảo mật", href: "/policy/privacy", slug: "privacy" },
  ];

  return (
    <aside className="w-full md:w-1/4 px-4">
      <div className="sticky top-0 p-4">
        <Link
          href="/help"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Trung tâm trợ giúp
        </Link>
        <nav className="space-y-1 mt-4">
          {mainTopics.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                categorySlug === item.slug
                  ? "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-neutral-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.name}</span>
              <HiChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
        </nav>
        <hr className="my-4 border-gray-200 dark:border-gray-600" />
        <nav className="space-y-1">
          {staticPages.map((page) => (
            <Link
              key={page.name}
              href={page.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                router.asPath?.startsWith(page.href)
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-neutral-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {page.name}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
