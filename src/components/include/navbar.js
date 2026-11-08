"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@bprogress/next/app";
import { Alert, Drawer } from "antd";
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Clock,
  FileUp,
  Hash,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  SquarePen,
  TrendingUp,
  User,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import SidebarNav, { getActiveNavKey } from "@/components/layout/SidebarNav";
import Dropdown from "@/components/ui/Dropdown";
import { useAuthContext, useChatContext } from "@/contexts/Support";
import { useTheme } from "@/contexts/themeContext";
import useCreatePostGate from "@/hooks/useCreatePostGate";
import CreatePostModal from "@/components/modals/CreatePostModal";
import { logoutRequest, getSearchSuggestions } from "@/app/Api";
import AccountSwitcher from "./AccountSwitcher";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import UserName from "@/components/profile/UserName";
import StyledUsername from "@/components/profile/StyledUsername";
import useOwnProfileTheme from "@/hooks/useOwnProfileTheme";
import { getSavedAccounts, removeSavedAccount, activateSavedAccount, storedPushEndpoint } from "@/utils/savedAccounts";
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "@/utils/recentSearches";
import { NAV_BADGE_CLASS, NAV_ICON_BUTTON_CLASS } from "./navStyles";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800";

function Logo({ compact = false }) {
  return (
    <Link href="/" className="flex min-w-max items-center gap-2" aria-label="Trang chủ">
      <img
        src="/images/logo.png"
        alt="Diễn đàn học sinh Chuyên Biên Hoà logo"
        className="h-10 w-10"
      />
      <span
        className={`text-[14px] leading-[18px] text-[#319527] ${
          compact ? "hidden sm:block" : "block"
        }`}
      >
        <span className="block font-light">Diễn đàn học sinh</span>
        <span className="block font-bold">Chuyên Biên Hòa</span>
      </span>
    </Link>
  );
}

// `hasSidebar`: the page shows the desktop left sidebar, so the menu button is only needed below xl.
export default function Navbar({ hasSidebar = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loggedIn, currentUser, setCurrentUser, setUserToken } =
    useAuthContext();
  const { toggleChat, conversations } = useChatContext();
  const { toggleTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl /");
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const refreshRecentSearches = useCallback(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    refreshRecentSearches();
  }, [refreshRecentSearches]);

  const handleRemoveRecent = (term) => {
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const fetchSuggestions = useCallback((q = "") => {
    setLoadingSuggestions(true);
    getSearchSuggestions(q ? { q } : {})
      .then((res) => {
        const topics = res.data?.data?.topics || res.data?.topics;
        if (Array.isArray(topics)) {
          setSuggestedTopics(topics);
        }
      })
      .catch((err) => {
        console.warn("[Navbar] Failed to load suggestions:", err);
      })
      .finally(() => {
        setLoadingSuggestions(false);
      });
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce when query changes
  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, fetchSuggestions]);

  // Close search dropdown on page change
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  const handleExecuteSearch = (val, type = "all") => {
    setSearchOpen(false);
    if (searchInputRef.current) searchInputRef.current.blur();
    const trimmed = (val || "").trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    refreshRecentSearches();

    if (type === "hashtag" || trimmed.startsWith("#")) {
      const clean = trimmed.replace(/^#/, "");
      setSearchQuery(`#${clean}`);
      router.push(`/search?type=hashtag&q=${encodeURIComponent(clean)}`);
    } else {
      setSearchQuery(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  // Calculate total unread messages
  // Filter out the public chat group "Tán gẫu linh tinh" from unread count
  const totalUnreadCount = conversations
    .filter(
      (conversation) =>
        !(
          conversation.type === "group" &&
          conversation.name === "Tán gẫu linh tinh"
        )
    )
    .reduce(
      (total, conversation) => total + (conversation.unread_count || 0),
      0
    );

  // Add class to body when email verification alert is shown
  useEffect(() => {
    if (loggedIn && !currentUser?.email_verified_at) {
      document.body.classList.add("has-email-verification-alert");
    } else {
      document.body.classList.remove("has-email-verification-alert");
    }
    return () => {
      document.body.classList.remove("has-email-verification-alert");
    };
  }, [loggedIn, currentUser?.email_verified_at]);

  // Ctrl+/ (⌘+/ on Mac) jumps to search.
  useEffect(() => {
    const platform = navigator.userAgentData?.platform || navigator.platform || "";
    if (/mac|iphone|ipad/i.test(platform)) setShortcutLabel("⌘ /");

    const handleKeyDown = (e) => {
      if (e.key !== "/" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const input = searchInputRef.current;
      // The search box is hidden on small screens; fall back to the search page.
      if (input && input.offsetParent !== null) input.focus();
      else router.push("/search");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const [composerOpen, setComposerOpen] = useState(false);
  const handleCreatePost = useCreatePostGate(useCallback(() => setComposerOpen(true), []));

  const handleSearch = (e) => {
    e.preventDefault();
    handleExecuteSearch(searchQuery, "all");
  };

  // Built on click (not during render) so server and client markup match.
  const goToLogin = (e) => {
    e.preventDefault();
    router.push(`/login?continue=${encodeURIComponent(window.location.href)}`);
  };

  const onLogout = async (ev) => {
    ev.preventDefault();
    // Wait for it: the axios interceptor reads the token asynchronously, so
    // swapping accounts first would revoke the next account's token instead.
    // With this browser's web push subscription, so the account being logged
    // out stops pushing here.
    await logoutRequest({ push_endpoint: storedPushEndpoint() || undefined }).catch(() => {});
    localStorage.removeItem("push_subscription_endpoint");
    // Forget this account on the device; fall back to another signed-in one if any
    if (currentUser?.id) removeSavedAccount(currentUser.id);
    const next = getSavedAccounts()[0];
    if (next) {
      activateSavedAccount(next);
      return;
    }
    setCurrentUser({});
    setUserToken(null); // This will now clear both localStorage and cookies
    localStorage.removeItem("CURRENT_USER");
    localStorage.removeItem("TOKEN");
    location.href = "/login";
  };

  const displayName = currentUser?.profile_name || currentUser?.username;
  // Own name style / avatar frame / name icon (cached; follows the editor).
  const ownTheme = useOwnProfileTheme(loggedIn ? currentUser : null);

  return (
    <>
      <nav style={{ top: "var(--app-banner-offset, 0px)" }} className="fixed inset-x-0 z-50 h-[69px] border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-700 dark:bg-[#2c2f2e]/90">
        <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-6">
          {/* Width lines the search box up with the page content next to the 260px sidebar. */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 xl:w-[228px]">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu"
              className={`${NAV_ICON_BUTTON_CLASS} ${hasSidebar ? "xl:hidden" : ""}`}
            >
              <Menu className="h-[22px] w-[22px]" />
            </button>
            <Logo compact />
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <div ref={searchContainerRef} className="relative max-w-[560px]">
              <form role="search" onSubmit={handleSearch} className="relative w-full">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 dark:text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!searchOpen) setSearchOpen(true);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    refreshRecentSearches();
                    if (suggestedTopics.length === 0) fetchSuggestions();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      searchInputRef.current?.blur();
                    }
                  }}
                  placeholder="Tìm kiếm bài viết, thành viên, chủ đề..."
                  aria-label="Tìm kiếm"
                  aria-keyshortcuts="Control+/"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 text-sm text-gray-800 shadow-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-neutral-600 dark:!bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-[#2b3a2a] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                {!searchQuery ? (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {shortcutLabel}
                  </kbd>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label="Xóa nội dung tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Suggestions dropdown */}
              {searchOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl bg-white dark:bg-neutral-800 shadow-2xl border border-gray-200/90 dark:border-neutral-700 overflow-hidden divide-y divide-gray-100 dark:divide-neutral-700">
                  {searchQuery.trim() ? (
                    <div>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleExecuteSearch(searchQuery.trim(), "all");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700/60 transition-colors border-b border-gray-100 dark:border-neutral-700"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          <Search className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 dark:text-neutral-100 truncate">
                            Tìm kiếm <span className="font-semibold text-primary-600 dark:text-primary-400">&ldquo;{searchQuery.trim()}&rdquo;</span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-neutral-400">
                            Nhấn Enter để xem kết quả
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>

                      {suggestedTopics.length > 0 && (
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-1">
                            <Hash className="w-3.5 h-3.5 text-primary-500" />
                            Chủ đề liên quan
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
                                    handleExecuteSearch(rawTag, "hashtag");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-primary-50 dark:bg-neutral-700 dark:hover:bg-primary-950/50 text-gray-700 dark:text-neutral-200 hover:text-primary-700 dark:hover:text-primary-300 border border-gray-200 dark:border-neutral-600 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                                >
                                  <Hash className="w-3 h-3 text-primary-500" />
                                  <span>{tagLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3">
                      {/* Recent searches row if present */}
                      {recentSearches.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-neutral-700/80">
                          <div className="flex items-center justify-between px-1 pb-2 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary-500" />
                              Tìm kiếm gần đây
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleClearAllRecent();
                              }}
                              className="text-[11px] font-normal lowercase text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                            >
                              xóa tất cả
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((term, idx) => (
                              <div
                                key={`nav-recent-${idx}`}
                                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 border border-gray-200 dark:border-neutral-600 hover:border-gray-300 dark:hover:border-neutral-500 transition-colors"
                              >
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleExecuteSearch(term, term.startsWith("#") ? "hashtag" : "all");
                                  }}
                                  className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                  <Search className="w-3 h-3 text-gray-400 dark:text-neutral-400" />
                                  <span className="truncate max-w-[140px]">{term}</span>
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveRecent(term);
                                  }}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-600/60 transition-colors"
                                  aria-label={`Xóa ${term}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-1 pb-2.5 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                          Chủ đề gợi ý & thịnh hành
                        </span>
                        <span className="text-[11px] font-normal lowercase text-gray-400 dark:text-neutral-400">
                          chạm để khám phá
                        </span>
                      </div>

                      {suggestedTopics.length > 0 ? (
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
                                  handleExecuteSearch(rawTag, "hashtag");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/50 transition-colors"
                              >
                                <Hash className="w-3 h-3 text-primary-500" />
                                <span>{tagLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-gray-400 dark:text-neutral-400">
                          {loadingSuggestions ? "Đang tải chủ đề gợi ý..." : "Không có chủ đề gợi ý"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href="/search" aria-label="Tìm kiếm" className={`${NAV_ICON_BUTTON_CLASS} lg:hidden`}>
              <Search className="h-[21px] w-[21px]" />
            </Link>

            {!loggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={goToLogin}
                  className="hidden h-10 items-center rounded-xl px-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 sm:flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="hidden h-10 items-center rounded-xl bg-primary-500 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-primary-600 sm:flex"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/login"
                  onClick={goToLogin}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-500 px-3 text-sm font-semibold !text-white sm:hidden"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </Link>
              </>
            ) : (
              <>
                <Dropdown>
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      aria-label="Tạo mới"
                      className="mr-1 flex h-10 items-center gap-1.5 rounded-xl bg-primary-500 px-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 sm:px-4"
                    >
                      <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
                      <span className="hidden sm:inline">Tạo mới</span>
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Content width="none" contentClasses="w-64 py-1.5 bg-white dark:!bg-neutral-700">
                    <button type="button" onClick={handleCreatePost} className={`${MENU_ITEM_CLASS} py-2.5`}>
                      <SquarePen className="h-[18px] w-[18px] shrink-0 text-primary-500" />
                      <span>
                        <span className="block font-medium">Bài viết</span>
                        <span className="block text-xs text-gray-500 dark:text-neutral-400">Chia sẻ, hỏi đáp cùng cộng đồng</span>
                      </span>
                    </button>
                    <Link href="/explore/study-materials/upload" className={`${MENU_ITEM_CLASS} py-2.5`}>
                      <FileUp className="h-[18px] w-[18px] shrink-0 text-[#8B5CF6]" />
                      <span>
                        <span className="block font-medium">Tài liệu</span>
                        <span className="block text-xs text-gray-500 dark:text-neutral-400">Đăng lên Chợ tài liệu</span>
                      </span>
                    </Link>
                  </Dropdown.Content>
                </Dropdown>

                <NotificationBell />

                <button
                  type="button"
                  onClick={toggleChat}
                  aria-label={totalUnreadCount > 0 ? `Tin nhắn (${totalUnreadCount} chưa đọc)` : "Tin nhắn"}
                  className={NAV_ICON_BUTTON_CLASS}
                >
                  <MessageCircle className="h-[21px] w-[21px]" strokeWidth={1.9} />
                  {totalUnreadCount > 0 && (
                    <span className={NAV_BADGE_CLASS}>
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  )}
                </button>

                <Dropdown>
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      aria-label="Tài khoản"
                      className="ml-0.5 flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 lg:pr-2"
                    >
                      <AvatarFrameWrap theme={ownTheme}>
                        <Avatar className="h-9 w-9 border border-gray-200 dark:border-neutral-600">
                          <AvatarImage
                            src={currentUser?.avatar_url || `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
                            alt=""
                            className="object-cover"
                          />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </AvatarFrameWrap>
                      {/* Fixed line height: a custom name font must not change the bar's height. */}
                      <span className="hidden min-w-0 max-w-[160px] items-center lg:flex">
                        <UserName
                          name={displayName}
                          theme={ownTheme}
                          className="text-sm font-medium leading-5 text-gray-800 dark:text-neutral-100"
                        />
                      </span>
                      <ChevronDown className="hidden h-4 w-4 text-gray-500 dark:text-neutral-400 lg:block" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Content width="none" contentClasses="w-60 py-1.5 bg-white dark:!bg-neutral-700">
                    <div className="border-b border-gray-100 px-4 pb-2.5 pt-1 dark:border-neutral-600">
                      <p className="flex min-w-0 items-center text-sm font-semibold text-gray-900 dark:text-neutral-100">
                        <UserName
                          name={displayName}
                          theme={ownTheme}
                          variant="full"
                          verified={currentUser?.verified === true}
                        />
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-neutral-400">
                        <StyledUsername username={currentUser?.username} theme={ownTheme} variant="full" />
                      </p>
                    </div>
                    <div className="py-1">
                      <Link className={MENU_ITEM_CLASS} href={`/${currentUser?.username}`}>
                        <UserRound className="h-4 w-4" /> Trang cá nhân
                      </Link>
                      <Link className={MENU_ITEM_CLASS} href="/wallet">
                        <Wallet className="h-4 w-4" /> Ví điểm của tôi
                      </Link>
                      <Link className={MENU_ITEM_CLASS} href="/settings">
                        <Settings className="h-4 w-4" /> Cài đặt
                      </Link>
                      <Link className={MENU_ITEM_CLASS} href="/help">
                        <CircleHelp className="h-4 w-4" /> Trợ giúp
                      </Link>
                      <button type="button" onClick={toggleTheme} className={MENU_ITEM_CLASS}>
                        <Moon className="h-4 w-4" /> Chế độ tối
                        <span className="ml-auto flex h-5 w-9 items-center rounded-full bg-gray-200 p-0.5 transition-colors dark:bg-primary-500">
                          <span className="h-4 w-4 rounded-full bg-white shadow transition-transform dark:translate-x-4" />
                        </span>
                      </button>
                    </div>
                    <AccountSwitcher currentUserId={currentUser?.id} itemClassName={MENU_ITEM_CLASS} />
                    <div className="border-t border-gray-100 pt-1 dark:border-neutral-600">
                      <button type="button" onClick={onLogout} className={MENU_ITEM_CLASS}>
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </div>
                  </Dropdown.Content>
                </Dropdown>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Menu drawer: mobile, and desktop pages without the left sidebar */}
      <Drawer
        title={<Logo />}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={288}
        className="dark:bg-[#3C3C3C]"
        styles={{
          header: { padding: "12px 16px" },
          body: { padding: 0 },
        }}
      >
        <div className="flex min-h-full flex-col px-3 py-4">
          <SidebarNav
            activeKey={getActiveNavKey(pathname)}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </Drawer>

      {loggedIn && !currentUser?.email_verified_at && (
        <Alert
          showIcon={false}
          message="Vui lòng xác minh email của bạn để sử dụng đầy đủ các tính năng"
          banner
          type="warning"
          className="fixed w-full left-0 z-40"
          style={{ top: "calc(69px + var(--app-banner-offset, 0px))" }}
          action={
            <Link
              href="/settings"
              className="text-[#319527] hover:underline font-medium"
            >
              Xác minh ngay
            </Link>
          }
        />
      )}

      <CreatePostModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}
