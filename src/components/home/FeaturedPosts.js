"use client";

import Link from "next/link";
import { Eye, FileText, Heart, MessageSquare, Sparkles, Video } from "lucide-react";
import Badges from "@/components/ui/Badges";
import { HomeCard, SectionHeader, UserAvatar } from "./HomeCard";
import {
  formatCommentCount,
  formatCompact,
  getLikeCount,
  getPostKind,
  getPostUrl,
  htmlToText,
} from "./homeUtils";

const KIND_STYLES = {
  "Tài liệu": "bg-[#E8506B]",
  Video: "bg-[#F97316]",
  "Album ảnh": "bg-primary-500",
  "Hình ảnh": "bg-primary-500",
  "Thảo luận": "bg-[#3B82F6]",
};

function FeaturedCard({ post }) {
  const url = getPostUrl(post);
  const kind = getPostKind(post);
  const cover = post.image_urls?.[0];
  const title = post.title || htmlToText(post.content).slice(0, 90) || "(Chưa có tiêu đề)";
  const PlaceholderIcon = post.video_urls?.length ? Video : FileText;

  return (
    <article className="group flex w-[240px] shrink-0 flex-col sm:w-auto">
      <Link
        href={url}
        className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-primary-50 dark:bg-neutral-700"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E5F5E2] to-[#C9EBC3] dark:from-[#2b3a2a] dark:to-[#1f2b1e]">
            <PlaceholderIcon className="h-10 w-10 text-primary-500/70" strokeWidth={1.6} />
          </div>
        )}
        <span
          className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm ${
            KIND_STYLES[kind] || "bg-primary-500"
          }`}
        >
          {kind}
        </span>
      </Link>

      <Link
        href={url}
        className="mt-3 line-clamp-2 text-[14px] font-semibold leading-snug text-gray-900 hover:text-primary-600 dark:text-neutral-100 dark:hover:text-[#86dc7c]"
      >
        {title}
      </Link>

      <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-gray-600 dark:text-neutral-400">
        <UserAvatar
          username={post.author?.username}
          name={post.author?.profile_name}
          anonymous={post.anonymous}
          size={20}
        />
        <span className="truncate">
          {post.anonymous
            ? "Người dùng ẩn danh"
            : post.author?.profile_name || post.author?.username}
        </span>
        {post.author?.verified && <Badges className="!ml-0 text-[13px]" />}
      </div>

      <div className="mt-2 flex items-center gap-3.5 text-[12px] text-gray-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1" title="Lượt thích">
          <Heart className="h-3.5 w-3.5 fill-[#EF4444] text-[#EF4444]" />
          {formatCompact(getLikeCount(post))}
        </span>
        <span className="inline-flex items-center gap-1" title="Bình luận">
          <MessageSquare className="h-3.5 w-3.5" />
          {formatCommentCount(post.comments)}
        </span>
        <span className="inline-flex items-center gap-1" title="Lượt xem">
          <Eye className="h-3.5 w-3.5" />
          {formatCompact(post.views)}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] text-gray-400 dark:text-neutral-500">{post.time}</p>
    </article>
  );
}

export default function FeaturedPosts({ posts = [] }) {
  if (posts.length === 0) return null;

  return (
    <HomeCard className="p-4 sm:p-5">
      <SectionHeader icon={Sparkles} title="Bài viết nổi bật" href="/feed" />
      <div className="scrollbar-hide -mx-4 mt-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {posts.map((post) => (
          <FeaturedCard key={post.id} post={post} />
        ))}
      </div>
    </HomeCard>
  );
}
