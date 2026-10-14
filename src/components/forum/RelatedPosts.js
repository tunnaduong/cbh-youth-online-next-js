"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileText, MessageSquare } from "lucide-react";
import { getRelatedPosts } from "@/app/Api";
import { generatePostUrl } from "@/utils/slugify";
import UserName from "@/components/profile/UserName";

// Bài viết liên quan nằm dưới phần bình luận: cùng chuyên mục trước, rồi
// các bài có tiêu đề hoặc hashtag giống. Không có bài nào thì không hiện gì.
export default function RelatedPosts({ postId }) {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    let active = true;
    setPosts(null);

    getRelatedPosts(postId)
      .then((response) => {
        if (active) setPosts(response.data?.posts ?? []);
      })
      .catch(() => {
        if (active) setPosts([]);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  if (posts && posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related-posts-title"
      className="rounded-2xl border border-[#EBEFEA] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] sm:p-5 dark:border-neutral-600 dark:!bg-[var(--main-white)]"
    >
      <h2
        id="related-posts-title"
        className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-neutral-100"
      >
        <FileText className="h-[18px] w-[18px] text-primary-500 dark:text-[#6bcf60]" aria-hidden="true" />
        Bài viết liên quan
      </h2>

      {posts === null ? (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-neutral-600" aria-label="Đang tải">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-3 py-3">
              <div className="h-14 w-20 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-neutral-600" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-4/5 rounded bg-gray-200 dark:bg-neutral-600" />
                <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-neutral-600" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-neutral-600">
          {posts.map((post) => {
            const href = generatePostUrl(post);
            const thumbnail = post.image_urls?.[0] || post.cover_url;
            const author = post.author || {};
            const authorName = post.anonymous
              ? "Ẩn danh"
              : author.profile_name || author.username;

            return (
              <li key={post.id} className="min-w-0">
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-600">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        loading="lazy"
                        className="media-loading h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 dark:text-neutral-400" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-white">
                      {post.title}
                    </p>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex min-w-0 max-w-full items-center">
                        {post.anonymous ? (
                          <span className="truncate">{authorName}</span>
                        ) : (
                          <UserName
                            name={authorName}
                            theme={author.profile_theme}
                            verified={author.verified}
                            className="text-xs"
                          />
                        )}
                      </span>
                      {post.subforum?.name && (
                        <span className="max-w-[10rem] truncate rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-neutral-600 dark:text-neutral-200">
                          {post.subforum.name}
                        </span>
                      )}
                      <span className="flex-shrink-0">{post.time}</span>
                      <span className="flex flex-shrink-0 items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.comments}
                        <span className="sr-only">bình luận</span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.views}
                        <span className="sr-only">lượt xem</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
