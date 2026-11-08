"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { search, getSearchSuggestions } from "../Api";
import HomeLayout from "@/layouts/HomeLayout";
import { PersonOutline } from "react-ionicons";
import Link from "next/link";
import { generatePostSlug } from "@/utils/slugify";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import UserName from "@/components/profile/UserName";
import StyledUsername from "@/components/profile/StyledUsername";
import Lottie from "lottie-react";
import refreshAnimation from "@/assets/refresh.json";

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHashtagParam = searchParams.get("type") === "hashtag";
  const rawQueryParam = searchParams.get("q") || "";
  const queryParam = isHashtagParam
    ? rawQueryParam.replace(/^#/, "")
    : rawQueryParam;

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState("all"); // all, users, posts
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    posts: [],
  });
  // Set only when we're showing "posts tagged #x" results (reached by
  // clicking a hashtag or typing "#x" into the search box), rather than
  // the normal all/users/posts tabs.
  const [hashtagTag, setHashtagTag] = useState(null);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [hasSearched, setHasSearched] = useState(Boolean(queryParam));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    getSearchSuggestions()
      .then((res) => {
        const topics = res.data?.data?.topics || res.data?.topics;
        if (Array.isArray(topics) && topics.length > 0) {
          setSuggestedTopics(topics);
        }
      })
      .catch((err) => {
        console.warn("[SearchClient] Failed to load suggestions:", err?.message || err);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchQuery(queryParam);
    if (queryParam) {
      setHasSearched(true);
      if (isHashtagParam) {
        performSearch(queryParam, "hashtag");
      } else {
        performSearch(queryParam, "all");
      }
    } else {
      setHasSearched(false);
      setResults({ users: [], posts: [] });
      setHashtagTag(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam, isHashtagParam]);

  const performSearch = async (query, type) => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setHashtagTag(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await search({
        query: type === "hashtag" ? query.trim().replace(/^#/, "") : query.trim(),
        type: type === "all" ? "all" : type,
        limit: type === "hashtag" ? 20 : 10,
      });

      if (response.data?.status === "success") {
        if (type === "all") {
          setHashtagTag(null);
          setResults({
            users: response.data.data.users || [],
            posts: response.data.data.posts || [],
          });
        } else if (type === "users") {
          setHashtagTag(null);
          setResults({
            users: response.data.data || [],
            posts: [],
          });
        } else if (type === "posts") {
          setHashtagTag(null);
          setResults({
            users: [],
            posts: response.data.data || [],
          });
        } else if (type === "hashtag") {
          setActiveTab("posts");
          setHashtagTag(response.data.data.hashtag || query.trim().replace(/^#/, ""));
          setResults({
            users: [],
            posts: response.data.data.posts || [],
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

  const handleSelectTopic = (rawTag) => {
    setDropdownOpen(false);
    const tag = rawTag.replace(/^#/, "");
    setSearchQuery(`#${tag}`);
    setHasSearched(true);
    router.push(`/search?type=hashtag&q=${encodeURIComponent(tag)}`);
    performSearch(tag, "hashtag");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setHasSearched(true);

    if (trimmed.startsWith("#") && trimmed.length > 1) {
      const tag = trimmed.slice(1);
      router.push(`/search?type=hashtag&q=${encodeURIComponent(tag)}`);
      performSearch(tag, "hashtag");
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      performSearch(trimmed, activeTab === "hashtag" ? "all" : activeTab);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setHashtagTag(null);
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim(), tab);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults({ users: [], posts: [] });
    setHashtagTag(null);
    setHasSearched(false);
    setDropdownOpen(false);
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
                <div ref={searchContainerRef} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!dropdownOpen) setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setDropdownOpen(false);
                    }}
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

                  {/* Autocomplete Suggestions Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSearch(e);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700/60 transition-colors border-b border-gray-100 dark:border-neutral-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary-600 dark:text-primary-400 shrink-0"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                          </svg>
                          <div className="text-sm text-gray-800 dark:text-neutral-100 truncate">
                            Tìm kiếm <span className="font-semibold text-primary-600 dark:text-primary-400">"{searchQuery.trim()}"</span>
                          </div>
                        </button>
                      )}

                      {suggestedTopics.length > 0 && (
                        <div className="p-3">
                          <div className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                            {searchQuery.trim() ? "Chủ đề liên quan" : "Chủ đề gợi ý & thịnh hành"}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedTopics.map((item, idx) => {
                              const tagLabel = item.label?.startsWith("#") ? item.label : `#${item.label}`;
                              const rawTag = item.label?.replace(/^#/, "");
                              return (
                                <button
                                  key={`${item.label}-${idx}`}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectTopic(rawTag);
                                  }}
                                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/50 transition-colors"
                                >
                                  {tagLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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

            {/* Quick Suggested Topics Row */}
            {suggestedTopics.length > 0 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-neutral-400 whitespace-nowrap shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary-500"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Gợi ý:
                </span>
                {suggestedTopics.map((item, idx) => {
                  const tagLabel = item.label?.startsWith("#") ? item.label : `#${item.label}`;
                  const rawTag = item.label?.replace(/^#/, "");
                  const isSelected = hashtagTag === rawTag || (isHashtagParam && queryParam === rawTag);
                  return (
                    <button
                      key={`${item.label}-${idx}`}
                      type="button"
                      onClick={() => handleSelectTopic(rawTag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                        isSelected
                          ? "bg-primary-600 text-white shadow-sm font-semibold"
                          : "bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/40"
                      }`}
                    >
                      {tagLabel}
                    </button>
                  );
                })}
              </div>
            )}
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
          ) : hasSearched && searchQuery.trim() ? (
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
                          {/* `profile_theme` is optional here: shown as soon as the search API sends it for users. */}
                          <AvatarFrameWrap theme={user.profile_theme} className="flex-shrink-0">
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
                          </AvatarFrameWrap>
                          <div className="flex-1 min-w-0">
                            <div className="flex min-w-0 items-center font-semibold text-gray-900 dark:text-gray-100">
                              <UserName
                                name={user.profile_name || user.username}
                                theme={user.profile_theme}
                                verified={user.verified === true}
                              />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              <StyledUsername username={user.username} theme={user.profile_theme} />
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
                    {hashtagTag
                      ? `Kết quả cho #${hashtagTag} (${results.posts.length})`
                      : `Bài viết (${results.posts.length})`}
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
                              <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <UserName
                                  name={
                                    post.author?.profile_name ||
                                    post.author?.username
                                  }
                                  theme={post.author?.profile_theme}
                                  verified={post.author?.verified === true}
                                />
                                <span className="flex-shrink-0">•</span>
                                <span className="flex-shrink-0">{formatTime(post.created_at)}</span>
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
            <div className="py-8 px-4 text-center">
              {suggestedTopics.length > 0 && (
                <div className="mb-8 max-w-md mx-auto text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary-600 dark:text-primary-400"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                      Chủ đề gợi ý & Thịnh hành
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map((item, idx) => {
                      const tagLabel = item.label?.startsWith("#") ? item.label : `#${item.label}`;
                      const rawTag = item.label?.replace(/^#/, "");
                      return (
                        <button
                          key={`${item.label}-${idx}`}
                          type="button"
                          onClick={() => handleSelectTopic(rawTag)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/40 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                        >
                          {tagLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <img
                src="/images/search-main.png"
                alt="Search"
                className="h-44 mx-auto mb-3"
              />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Thử bắt đầu bằng cách tìm kiếm người dùng, bài viết, chủ đề...
              </p>
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}
