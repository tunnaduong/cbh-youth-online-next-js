"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { helpArticles } from "@/data/helpArticles";

export default function TopicList({ categorySlug, articleSlug }) {
  const router = useRouter();

  // Get categorySlug and articleSlug from props or router
  const currentCategorySlug = categorySlug || router.query.categorySlug || {};
  const currentArticleSlug = articleSlug || router.query.articleSlug || {};

  const currentCategory = helpArticles.find(
    (cat) => cat.slug === currentCategorySlug
  );

  if (!currentCategory) {
    return null; // Or some fallback UI
  }

  return (
    <aside className="w-full md:w-1/4 px-4">
      <div className="sticky top-0 p-4">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Trong chủ đề này
        </h3>
        <nav className="space-y-1">
          {currentCategory.articles.map((article) => (
            <Link
              key={article.slug}
              href={`/help/${currentCategory.slug}/${article.slug}`}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                article.slug === currentArticleSlug
                  ? "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-neutral-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {article.title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
