"use client";

import Link from "next/link";
import UserName from "@/components/profile/UserName";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CirclePlay,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import {
  getFollowingFeedPosts,
  getLatestFeedPosts,
  getPersonalizedFeedPosts,
} from "@/app/Api";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import { HomeCard, SectionHeader, UserAvatar } from "./HomeCard";
import {
  formatCommentCount,
  formatCompact,
  getPostKind,
  getPostUrl,
  htmlToText,
} from "./homeUtils";

const MODES = [
  { key: "latest", label: "Mới nhất" },
  { key: "for_you", label: "Dành cho bạn", requiresLogin: true },
  { key: "following", label: "Đang theo dõi", requiresLogin: true },
];

const HIDDEN_POSTS_KEY = "cbh_hidden_latest_posts";

function getHiddenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_POSTS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveHiddenIds(ids) {
  try {
    localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify([...ids]));
  } catch {}
}

function PostRow({ post, onHide }) {
  const url = getPostUrl(post);
  const text = htmlToText(post.content);
  const title = post.title || text.slice(0, 100) || "(Chưa có tiêu đề)";
  const excerpt = post.title ? text : "";
  const thumbnail = post.image_urls?.[0] || post.cover_url;
  const PlaceholderIcon = post.video_urls?.length
    ? CirclePlay
    : post.document_urls?.length
      ? FileText
      : MessagesSquare;
  const authorName = post.anonymous
    ? "Người dùng ẩn danh"
    : post.author?.profile_name || post.author?.username;

  const stats = (
    <>
      <span className="inline-flex items-center gap-1.5" title="Bình luận">
        <MessageSquare className="h-3.5 w-3.5" />
        {formatCommentCount(post.comments)}
      </span>
      <span className="inline-flex items-center gap-1.5" title="Lượt xem">
        <Eye className="h-3.5 w-3.5" />
        {formatCompact(post.views)}
      </span>
    </>
  );

  return (
    <article className="group relative flex gap-3 py-4 sm:gap-4">
      {post.anonymous ? (
        <UserAvatar anonymous size={40} />
      ) : (
        <Link href={`/${post.author?.username}`} className="shrink-0">
          <UserAvatar
            username={post.author?.username}
            name={authorName}
            size={40}
            theme={post.author?.profile_theme}
          />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={url}
          className="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-gray-900 hover:text-primary-600 dark:text-neutral-100 dark:hover:text-[#86dc7c]"
        >
          {title}
        </Link>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
          {post.anonymous ? (
            <span className="font-medium text-primary-500">{authorName}</span>
          ) : (
            <Link
              href={`/${post.author?.username}`}
              className="inline-flex min-w-0 max-w-[160px] items-center font-medium text-primary-500 hover:underline dark:text-[#6bcf60] sm:max-w-[200px]"
            >
              <UserName
                name={authorName}
                theme={post.author?.profile_theme}
                variant="full"
                verified={!!post.author?.verified}
                badgeClassName="text-[13px]"
              />
            </Link>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.time}</span>
          <span aria-hidden="true">·</span>
          <span>{getPostKind(post)}</span>
        </div>
        {excerpt && (
          <p className="mt-1.5 line-clamp-2 break-words text-[13px] leading-relaxed text-gray-500 dark:text-neutral-400">
            {excerpt}
          </p>
        )}
        <div className="mt-2 flex items-center gap-4 text-[12px] text-gray-500 dark:text-neutral-400 sm:hidden">
          {stats}
        </div>
      </div>

      <div className="hidden w-14 shrink-0 flex-col justify-center gap-2 text-[12px] text-gray-500 dark:text-neutral-400 sm:flex">
        {stats}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {thumbnail ? (
          <Link
            href={url}
            className="h-[68px] w-[68px] overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-700 sm:h-[72px] sm:w-[96px]"
          >
            <img
              src={thumbnail}
              alt={`Ảnh minh họa: ${title}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </Link>
        ) : (
          <Link
            href={url}
            aria-hidden="true"
            tabIndex={-1}
            className="hidden h-[72px] w-[96px] items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF7EC] to-[#DCEFD8] text-primary-500/60 dark:from-[#2b3a2a] dark:to-[#1f2b1e] sm:flex"
          >
            <PlaceholderIcon className="h-6 w-6" strokeWidth={1.8} />
          </Link>
        )}
        <button
          type="button"
          onClick={() => onHide(post.id)}
          aria-label="Ẩn bài viết này khỏi trang chủ"
          title="Ẩn bài viết này"
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
        >
          <EyeOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ẩn</span>
        </button>
      </div>
    </article>
  );
}

function PostRowSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 py-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-neutral-600" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-neutral-600" />
      </div>
      <div className="hidden h-[72px] w-[96px] shrink-0 rounded-xl bg-gray-200 dark:bg-neutral-600 sm:block" />
    </div>
  );
}

const fetchPage = (mode, page, seed) => {
  if (mode === "for_you") return getPersonalizedFeedPosts(page, seed);
  if (mode === "following") return getFollowingFeedPosts(page);
  return getLatestFeedPosts(page);
};

const hasMorePages = (data) =>
  !data?.exhausted && Number(data?.current_page) < Number(data?.last_page);

export default function LatestPosts({ loggedIn, initialFeed }) {
  const [mode, setMode] = useState("latest");
  const [posts, setPosts] = useState(initialFeed?.posts || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(Boolean(initialFeed?.hasMore));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  // The server already fetched page 2 (for the featured pool); reuse it once.
  const preloadedNextRef = useRef(initialFeed?.nextPosts || null);
  const seedRef = useRef(Math.floor(Math.random() * 1_000_000_000));
  const requestIdRef = useRef(0);
  const { refreshTrigger } = usePostRefresh();

  // Load hidden IDs from localStorage on mount (client only)
  useEffect(() => {
    setHiddenIds(getHiddenIds());
  }, []);

  const handleHide = (postId) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      saveHiddenIds(next);
      return next;
    });
  };

  const loadFirstPage = async (nextMode) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPage(nextMode, 1, seedRef.current);
      if (requestId !== requestIdRef.current) return;
      setPosts(response.data?.data || []);
      setHasMore(hasMorePages(response.data));
      setPage(1);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError("Không tải được bài viết. Vui lòng thử lại.");
      setPosts([]);
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    preloadedNextRef.current = null;
    setMode(nextMode);
    loadFirstPage(nextMode);
  };

  // A post was just created: make sure it shows up at the top.
  useEffect(() => {
    if (refreshTrigger > 0) {
      preloadedNextRef.current = null;
      loadFirstPage(mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const appendPosts = (newPosts) => {
    setPosts((prev) => {
      const seen = new Set(prev.map((post) => post.id));
      return [...prev, ...newPosts.filter((post) => !seen.has(post.id))];
    });
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;

    if (mode === "latest" && nextPage === 2 && preloadedNextRef.current) {
      appendPosts(preloadedNextRef.current.posts);
      setHasMore(preloadedNextRef.current.hasMore);
      preloadedNextRef.current = null;
      setPage(nextPage);
      return;
    }

    const requestId = requestIdRef.current;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await fetchPage(mode, nextPage, seedRef.current);
      if (requestId !== requestIdRef.current) return;
      appendPosts(response.data?.data || []);
      setHasMore(hasMorePages(response.data));
      setPage(nextPage);
    } catch (err) {
      setError("Không tải được thêm bài viết. Vui lòng thử lại.");
    } finally {
      setLoadingMore(false);
    }
  };

  const availableModes = MODES.filter((item) => loggedIn || !item.requiresLogin);
  const currentMode = MODES.find((item) => item.key === mode);
  const visiblePosts = posts.filter((p) => !hiddenIds.has(p.id));

  return (
    <HomeCard className="p-4 sm:p-5">
      <SectionHeader icon={Newspaper} title="Bài viết mới nhất">
        {availableModes.length > 1 && (
          <Dropdown>
            <Dropdown.Trigger>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                {currentMode.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </Dropdown.Trigger>
            <Dropdown.Content width="none" contentClasses="w-44 py-1 bg-white dark:!bg-neutral-700">
              {availableModes.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleModeChange(item.key)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 ${
                    item.key === mode
                      ? "font-semibold text-primary-600 dark:text-[#86dc7c]"
                      : "text-gray-700 dark:text-neutral-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </Dropdown.Content>
          </Dropdown>
        )}
      </SectionHeader>

      <div className="mt-1 divide-y divide-gray-100 dark:divide-neutral-600">
        {loading ? (
          [...Array(4)].map((_, index) => <PostRowSkeleton key={index} />)
        ) : visiblePosts.length > 0 ? (
          visiblePosts.map((post) => <PostRow key={post.id} post={post} onHide={handleHide} />)
        ) : (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
            {error ||
              (mode === "following"
                ? "Chưa có bài viết nào từ những người bạn theo dõi."
                : "Chưa có bài viết nào.")}
          </p>
        )}
      </div>

      {!loading && visiblePosts.length > 0 && (
        <div className="mt-2">
          {error && <p className="mb-2 text-center text-[13px] text-red-500">{error}</p>}
          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-primary-500 transition hover:bg-primary-50 disabled:opacity-60 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
            >
              <RefreshCw className={`h-4 w-4 ${loadingMore ? "animate-spin" : ""}`} />
              {loadingMore ? "Đang tải..." : "Tải thêm bài viết"}
            </button>
          ) : (
            <Link
              href="/feed"
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-primary-500 transition hover:bg-primary-50 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
            >
              Xem thêm trên Bảng tin
            </Link>
          )}
        </div>
      )}
    </HomeCard>
  );
}
