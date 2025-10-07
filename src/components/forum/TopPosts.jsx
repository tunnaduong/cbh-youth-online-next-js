"use client";

import RankBadge from "../ui/RankBadge";
import Link from "next/link";
import { generatePostSlug } from "@/utils/slugify";
import { timeAgoInVietnamese } from "@/utils/dateFormat";
import { RxHamburgerMenu } from "react-icons/rx";
import { useState, useEffect } from "react";
import Dropdown from "../ui/Dropdown";
import { useSearchParams } from "next/navigation";
import { getHomeData } from "@/app/Api";
import { usePostRefresh } from "@/contexts/PostRefreshContext";

export default function TopPosts() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";
  const { refreshTrigger } = usePostRefresh();

  const fetchPosts = async (sort = "latest") => {
    try {
      setLoading(true);
      setError(null);
      const response = await getHomeData(sort);
      setLatestPosts(response.data.latestPosts || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentSort);
  }, [currentSort]);

  // Listen for refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPosts(currentSort);
    }
  }, [refreshTrigger, currentSort]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts(currentSort);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 950);
  };
  return (
    <div className="border dark:!border-[#585857] rounded-lg long-shadow bg-white dark:!bg-[var(--main-white)] overflow-hidden">
      <div className="flex flex-wrap items-stretch">
        <Link
          href="?sort=latest"
          className={`px-4 text-sm flex items-center hover:bg-gray-50 tab-button dark:hover:bg-neutral-500 ${
            currentSort === "latest" ? "tab-button-active" : ""
          }`}
          scroll={false}
        >
          <span
            className={`py-2 dark:text-neutral-300 ${
              currentSort === "latest" ? "!text-primary-500" : ""
            }`}
          >
            Bài mới
          </span>
        </Link>
        <Link
          href="?sort=most_viewed"
          className={`hidden sm:flex px-4 text-sm items-center bor-left hover:bg-gray-50 tab-button dark:border-[#585857] dark:hover:bg-neutral-500 ${
            currentSort === "most_viewed" ? "tab-button-active" : ""
          }`}
          scroll={false}
        >
          <span
            className={`py-2 dark:text-neutral-300 ${
              currentSort === "most_viewed" ? "!text-primary-500" : ""
            }`}
          >
            Chủ đề xem nhiều
          </span>
        </Link>
        <Link
          href="?sort=most_engaged"
          className={`px-4 text-sm hidden sm:flex items-center bor-right bor-left hover:bg-gray-50 tab-button dark:border-[#585857] dark:hover:bg-neutral-500 ${
            currentSort === "most_engaged" ? "tab-button-active" : ""
          }`}
          scroll={false}
        >
          <span
            className={`py-2 dark:text-neutral-300 ${
              currentSort === "most_engaged" ? "!text-primary-500" : ""
            }`}
          >
            Tương tác nhiều
          </span>
        </Link>
        <Dropdown>
          <Dropdown.Trigger>
            <button className="h-9 w-9 border-l items-center justify-center tab-button bor-right flex sm:hidden hover:bg-gray-50 dark:border-neutral-500 dark:hover:bg-neutral-500">
              <RxHamburgerMenu />
            </button>
          </Dropdown.Trigger>
          <Dropdown.Content align="responsive">
            <Dropdown.Link
              href="?sort=most_viewed"
              className={
                currentSort === "most_viewed"
                  ? "bg-gray-100 dark:bg-neutral-800 font-medium"
                  : ""
              }
              scroll={false}
            >
              Chủ đề xem nhiều
            </Dropdown.Link>
            <Dropdown.Link
              href="?sort=most_engaged"
              className={
                currentSort === "most_engaged"
                  ? "bg-gray-100 dark:bg-neutral-800 font-medium"
                  : ""
              }
              scroll={false}
            >
              Tương tác nhiều
            </Dropdown.Link>
          </Dropdown.Content>
        </Dropdown>
        <div className="ml-auto flex">
          <button
            className="h-9 w-9 border-l dark:border-[#585857] dark:text-neutral-300 flex items-center justify-center tab-button hover:bg-gray-50 dark:hover:bg-neutral-500"
            onClick={handleRefresh}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-refresh-cw-icon lucide-refresh-cw h-4 w-4 transition-transform duration-1000 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        {loading ? (
          <div className="animate-pulse">
            {[...Array(10)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className={`${
                  index === 9 ? "" : "bor-bottom"
                } dark:!border-b-[#585857] flex py-1 px-2`}
              >
                {/* Skeleton for rank badge */}
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full mr-2 flex-shrink-0"></div>

                {/* Skeleton for post title */}
                <div className="flex-1 max-w-[90%] overflow-hidden flex items-center">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>

                {/* Skeleton for time */}
                <div className="sm:flex items-center justify-end hidden text-right w-[100px] max-w-[100px]">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>

                {/* Skeleton for author */}
                <div className="sm:flex items-center pl-2 hidden text-right w-[150px] max-w-[150px]">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <span>Lỗi: {error}</span>
          </div>
        ) : latestPosts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <span>Không có bài viết nào</span>
          </div>
        ) : (
          latestPosts.map((post, index) => (
            <div
              key={`post-${post.id}`}
              className={`${
                index === latestPosts.length - 1 ? "" : "bor-bottom"
              } dark:!border-b-[#585857] hover:bg-gray-50 flex py-1 px-2 dark:hover:bg-neutral-600`}
            >
              <RankBadge index={index} />
              <div className="flex items-center flex-1 max-w-[90%] overflow-hidden">
                <Link
                  href={`/${
                    post.anonymous ? "anonymous" : post.username || "anonymous"
                  }/posts/${generatePostSlug(post.id, post.title)}`}
                  className="truncate block w-full text-[12.7px] !text-primary-500 hover:underline"
                >
                  {post.title}
                </Link>
              </div>
              <div className="sm:flex items-center justify-end hidden text-right text-gray-500 text-[11px] whitespace-nowrap w-[100px] max-w-[100px]">
                {timeAgoInVietnamese(post.created_at)}
              </div>
              <div className="sm:flex items-center pl-2 hidden text-right text-[11px] whitespace-nowrap w-[150px] max-w-[150px]">
                <div className="flex items-center justify-end">
                  {post.anonymous ? (
                    <span className="!text-primary-500 truncate inline-block max-w-[150px]">
                      Người dùng ẩn danh
                    </span>
                  ) : (
                    <Link
                      href={`/${post.username || "anonymous"}`}
                      className="!text-primary-500 hover:underline truncate inline-block max-w-[150px]"
                    >
                      {post.author_name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
