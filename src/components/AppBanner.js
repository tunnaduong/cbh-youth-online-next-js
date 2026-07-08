"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AppBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCheckBanner = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        setVisible(false);
        return;
      }

      // Check if user has closed the banner in the current session
      if (sessionStorage.getItem("app_banner_closed")) {
        setVisible(false);
        return;
      }

      // 1. Check Story ID in Query Params
      const params = new URLSearchParams(window.location.search);
      const storyId = params.get("storyId");
      if (storyId) {
        setAppUrl(`com.fatties.youth://story/${storyId}`);
        setVisible(true);
        return;
      }

      // 2. Check Post Segment in Path
      // Expected path: /[username]/posts/[postId] (e.g. /anonymous/posts/366199398-phong-canh)
      const pathParts = window.location.pathname.split("/");
      if (pathParts[2] === "posts" && pathParts[3]) {
        const postSegment = pathParts[3];
        setAppUrl(`com.fatties.youth://post/${postSegment}`);
        setVisible(true);
        return;
      }

      setVisible(false);
    };

    // Run initial check
    handleCheckBanner();

    // Listen for custom events or state changes
    const interval = setInterval(handleCheckBanner, 1000); // Poll for query param changes since Next.js router doesn't trigger path updates for some searchParam changes
    return () => clearInterval(interval);
  }, [pathname]);

  const handleOpenInApp = () => {
    if (!appUrl) return;
    window.location.href = appUrl;

    // Fallback: If after 2 seconds we are still on the web page, offer to download the app
    setTimeout(() => {
      if (!document.hidden) {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const storeUrl = isIOS
          ? "https://apps.apple.com/app/id_YOUR_APP_STORE_ID"
          : "https://play.google.com/store/apps/details?id=com.fatties.youth";
        if (confirm("Chưa cài app? Tải về ngay để trải nghiệm tốt nhất!")) {
          window.location.href = storeUrl;
        }
      }
    }, 2000);
  };

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem("app_banner_closed", "1");
  };

  if (!visible) return null;

  return (
    <div
      id="app-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1a1a2e",
        color: "#fff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "sans-serif",
        fontSize: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src="/images/logo.png"
          alt="App Icon"
          style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }}
          onError={(e) => {
            e.target.src = "/favicon.ico";
          }}
        />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: "600", color: "#ffffff" }}>CBH Youth Online</div>
          <div style={{ fontSize: "12px", opacity: 0.7, color: "#cccccc" }}>
            {appUrl.includes("story") ? "Xem tin này trong ứng dụng" : "Xem bài viết này trong ứng dụng"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={handleOpenInApp}
          style={{
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          Mở App
        </button>
        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            color: "#aaa",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            padding: "4px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
