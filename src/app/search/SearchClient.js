"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { search } from "../Api";
import HomeLayout from "@/layouts/HomeLayout";
import { PersonOutline } from "react-ionicons";
import Link from "next/link";
import { generatePostSlug } from "@/utils/slugify";
import Lottie from "lottie-react";
import refreshAnimation from "@/assets/refresh.json";

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState("all"); // all, users, posts
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    posts: [],
  });

  useEffect(() => {
    setSearchQuery(queryParam);
    if (queryParam) {
      performSearch(queryParam, "all");
    }
  }, [queryParam]);

  const performSearch = async (query, type) => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await search({
        query: query.trim(),
        type: type === "all" ? "all" : type,
        limit: 10,
      });

      if (response.data?.status === "success") {
        if (type === "all") {
          setResults({
            users: response.data.data.users || [],
            posts: response.data.data.posts || [],
          });
        } else if (type === "users") {
          setResults({
            users: response.data.data || [],
            posts: [],
          });
        } else if (type === "posts") {
          setResults({
            users: [],
            posts: response.data.data || [],
          });
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults({ users: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery.trim(), activeTab);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim(), tab);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults({ users: [], posts: [] });
    router.push("/search");
  };

  const handleBack = () => {
    router.back();
  };

  const getUserAvatarUrl = (username) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${username}/avatar`;
  };

  const formatTime = (timeString) => {
    // Handle Vietnamese time format like "4 tháng trước"
    if (timeString.includes("tháng")) {
      return timeString;
    }
    if (timeString.includes("giờ")) {
      return timeString;
    }
    if (timeString.includes("phút")) {
      return timeString;
    }
    if (timeString.includes("ngày")) {
      return timeString;
    }
    return timeString;
  };

  return (
    <HomeLayout
      activeNav={null}
      activeBar={null}
      sidebarItems={[]}
      sidebarType="all"
      showRightSidebar={false}
      showLeftSidebar={false}
    >
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Search Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-700 dark:text-gray-300"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </button>
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="w-full bg-gray-100 dark:bg-neutral-700 rounded-lg px-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <path d="m9 9 6 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => handleTabChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => handleTabChange("users")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "users"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Người dùng
              </button>
              <button
                onClick={() => handleTabChange("posts")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Bài viết
              </button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <>
              <Lottie
                animationData={refreshAnimation}
                loop={true}
                style={{ width: 80, height: 80 }}
                className="mx-auto"
              />
              <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                Đang tìm kiếm...
              </div>
            </>
          ) : searchQuery.trim() ? (
            <div className="space-y-6">
              {/* Users Section */}
              {(activeTab === "all" || activeTab === "users") && (
                <div>
                  <h2 className="text-lg font-bold text-primary-500 dark:text-primary-500 mb-4">
                    Người dùng ({results.users.length})
                  </h2>
                  {results.users.length > 0 ? (
                    <div className="bg-white dark:bg-neutral-800 rounded-lg divide-y divide-gray-200 dark:divide-neutral-700">
                      {results.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/${user.username}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-600 flex items-center justify-center overflow-hidden relative">
                              <img
                                src={getUserAvatarUrl(user.username)}
                                alt={user.profile_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) {
                                    fallback.classList.remove("hidden");
                                    fallback.classList.add("flex");
                                  }
                                }}
                              />
                              <div className="hidden absolute inset-0 items-center justify-center">
                                <PersonOutline
                                  color="#6B7280"
                                  height="24px"
                                  width="24px"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user.profile_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              @{user.username}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Không tìm thấy người dùng nào
                    </p>
                  )}
                </div>
              )}

              {/* Posts Section */}
              {(activeTab === "all" || activeTab === "posts") && (
                <div>
                  <h2 className="text-lg font-bold text-primary-500 dark:text-primary-500 mb-4">
                    Bài viết ({results.posts.length})
                  </h2>
                  {results.posts.length > 0 ? (
                    <div className="bg-white dark:bg-neutral-800 rounded-lg divide-y divide-gray-200 dark:divide-neutral-700">
                      {results.posts.map((post) => {
                        const username = post.author?.username || "anonymous";
                        const slug = generatePostSlug(post.id, post.title);
                        return (
                          <Link
                            key={post.id}
                            href={`/${username}/posts/${slug}`}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                          >
                            {post.image_urls && post.image_urls.length > 0 && (
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-neutral-600">
                                  <img
                                    src={post.image_urls[0]}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                                {post.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {post.author?.profile_name ||
                                    post.author?.username}
                                </span>
                                <span>•</span>
                                <span>{formatTime(post.created_at)}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Không tìm thấy bài viết nào
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 px-5 text-gray-500 dark:text-gray-400">
              <img
                src="/images/search-main.png"
                alt="Search"
                className="h-48 mx-auto"
              />
              <br />
              Thử bắt đầu bằng cách tìm kiếm người
              <br />
              dùng, bài viết, loa lớn...
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}
