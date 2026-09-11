"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@bprogress/next/app";
import { Alert, Drawer } from "antd";
import {
  ChevronDown,
  CircleHelp,
  FileUp,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  SquarePen,
  User,
  UserRound,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import SidebarNav, { getActiveNavKey } from "@/components/layout/SidebarNav";
import Dropdown from "@/components/ui/Dropdown";
import { useAuthContext, useChatContext } from "@/contexts/Support";
import { useTheme } from "@/contexts/themeContext";
import useCreatePostGate from "@/hooks/useCreatePostGate";
import { logoutRequest } from "@/app/Api";
import { NAV_BADGE_CLASS, NAV_ICON_BUTTON_CLASS } from "./navStyles";

// Only fetched the first time someone opens the composer from the navbar.
const CreatePostModal = dynamic(() => import("@/components/modals/CreatePostModal"), {
  ssr: false,
});

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800";

function Logo({ compact = false }) {
  return (
    <Link href="/" className="flex min-w-max items-center gap-2" aria-label="Trang chủ">
      <img src="/images/logo.png" alt="" className="h-10 w-10" />
      <span
        className={`text-[14px] leading-[18px] text-gray-900 dark:text-neutral-100 ${
          compact ? "hidden sm:block" : "block"
        }`}
      >
        <span className="block font-medium">Diễn đàn học sinh</span>
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
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl /");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMounted, setComposerMounted] = useState(false);
  const searchInputRef = useRef(null);

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

  const openComposer = useCallback(() => {
    setComposerMounted(true);
    setComposerOpen(true);
  }, []);
  const handleCreatePost = useCreatePostGate(openComposer);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  // Built on click (not during render) so server and client markup match.
  const goToLogin = (e) => {
    e.preventDefault();
    router.push(`/login?continue=${encodeURIComponent(window.location.href)}`);
  };

  const onLogout = (ev) => {
    ev.preventDefault();
    logoutRequest();
    setCurrentUser({});
    setUserToken(null); // This will now clear both localStorage and cookies
    localStorage.removeItem("CURRENT_USER");
    localStorage.removeItem("TOKEN");
    location.href = "/login";
  };

  const displayName = currentUser?.profile_name || currentUser?.username;

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 h-[69px] border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-700 dark:bg-[#2c2f2e]/90">
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
            <form role="search" onSubmit={handleSearch} className="relative max-w-[560px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 dark:text-neutral-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết, thành viên, chủ đề..."
                aria-label="Tìm kiếm"
                aria-keyshortcuts="Control+/"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-16 text-sm text-gray-800 shadow-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-neutral-600 dark:!bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-[#2b3a2a]"
              />
              {!searchQuery && (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {shortcutLabel}
                </kbd>
              )}
            </form>
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
                      <Avatar className="h-9 w-9 border border-gray-200 dark:border-neutral-600">
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
                          alt=""
                          className="object-cover"
                        />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-800 dark:text-neutral-100 lg:block">
                        {displayName}
                      </span>
                      <ChevronDown className="hidden h-4 w-4 text-gray-500 dark:text-neutral-400 lg:block" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Content width="none" contentClasses="w-60 py-1.5 bg-white dark:!bg-neutral-700">
                    <div className="border-b border-gray-100 px-4 pb-2.5 pt-1 dark:border-neutral-600">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">{displayName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-neutral-400">@{currentUser?.username}</p>
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

      {composerMounted && (
        <CreatePostModal open={composerOpen} onClose={() => setComposerOpen(false)} />
      )}

      {loggedIn && !currentUser?.email_verified_at && (
        <Alert
          showIcon={false}
          message="Vui lòng xác minh email của bạn để sử dụng đầy đủ các tính năng"
          banner
          type="warning"
          className="fixed w-full left-0 z-40"
          style={{ top: "69px" }}
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
    </>
  );
}
