"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { openDeepLink, isIOSDevice } from "@/lib/deepLink";

export default function AppBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const bannerRef = useRef(null);

  // The banner sits in the page flow above the fixed navbar. Publish its
  // height (--app-banner-h pads the body) and how much of it is still on
  // screen (--app-banner-offset pushes the navbar down) so the navbar rides
  // under it and then sticks to the top once it has scrolled away.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible || !bannerRef.current) return;
    const el = bannerRef.current;
    const update = () => {
      const h = el.offsetHeight;
      root.style.setProperty("--app-banner-h", `${h}px`);
      root.style.setProperty("--app-banner-offset", `${Math.max(0, h - window.scrollY)}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      root.style.removeProperty("--app-banner-h");
      root.style.removeProperty("--app-banner-offset");
    };
  }, [visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAndroidOrIOS = () => {
      const ua = navigator.userAgent;
      return /Android/i.test(ua) || /iPhone|iPad|iPod/i.test(ua);
    };

    const handleCheckBanner = () => {
      // Only show banner on Android and iOS devices
      if (!isAndroidOrIOS()) {
        setVisible(false);
        return;
      }

      // Don't show on easter egg page
      if (pathname === "/egg") {
        setVisible(false);
        return;
      }

      // If user already closed it, never show again
      if (localStorage.getItem("app_banner_closed")) {
        setVisible(false);
        return;
      }

      // Always show on mobile. Determine deep link from current location.
      const params = new URLSearchParams(window.location.search);

      // Already inside the app's own webview (?app=true), or actively
      // playing a game - the banner would just cover the game iframe.
      if (params.get("app") === "true" || /^\/explore\/games\/[^/]+/.test(pathname)) {
        setVisible(false);
        return;
      }

      const storyId = params.get("storyId");
      if (storyId) {
        setAppUrl(`com.fatties.youth://story/${storyId}`);
      } else {
        // Expected path: /[username]/posts/[postId] (e.g. /anonymous/posts/366199398-phong-canh)
        const pathParts = window.location.pathname.split("/");
        if (pathParts[2] === "posts" && pathParts[3]) {
          setAppUrl(`com.fatties.youth://post/${pathParts[3]}`);
        } else {
          setAppUrl("com.fatties.youth://");
        }
      }

      setVisible(true);
    };

    // Run initial check
    handleCheckBanner();

    // Listen for custom events or state changes
    const interval = setInterval(handleCheckBanner, 1000); // Poll for query param changes since Next.js router doesn't trigger path updates for some searchParam changes
    return () => clearInterval(interval);
  }, [pathname]);

  const handleOpenInApp = () => {
    if (!appUrl) return;

    const appType = appUrl.includes("story") ? "story" : appUrl.includes("post") ? "post" : "";
    const value = appType === "story" ? new URLSearchParams(window.location.search).get("storyId") : appType === "post" ? window.location.pathname.split("/")[3] : "";

    if (appType && value) {
      openDeepLink(appType, value, {
        onFallback: (storeUrl) => {
          if (confirm("Chưa cài app? Tải về ngay để trải nghiệm tốt nhất!")) {
            window.location.href = storeUrl;
          }
        },
        delay: isIOSDevice() ? 2500 : 2000,
      });
      return;
    }

    window.location.href = appUrl;
  };

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem("app_banner_closed", "1");
  };

  if (!visible) return null;

  const subtitle = appUrl.includes("story")
    ? "Xem tin này trong ứng dụng"
    : appUrl.includes("post")
    ? "Xem bài viết này trong ứng dụng"
    : "Mở ứng dụng để trải nghiệm tốt hơn";

  return (
    <div
      id="app-banner"
      ref={bannerRef}
      className="absolute inset-x-0 top-0 z-[60] border-b border-gray-200 bg-white dark:border-neutral-700 dark:bg-[#232625]"
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng"
          className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src="/images/logo.png"
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1 shadow-sm dark:border-neutral-600"
          onError={(e) => {
            e.target.src = "/favicon.ico";
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
            CBH Youth Online
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleOpenInApp}
          className="shrink-0 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 active:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          Mở app
        </button>
      </div>
    </div>
  );
}
