"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./ui/LoadingScreen";
import { isInApp } from "@/utils/appMode";

export default function LoadingWrapper({ children }) {
  const pathname = usePathname();

  // Check if loading should be hidden via environment variable or on /egg, /admin, or /explore/games
  const hideLoading =
    process.env.NEXT_PUBLIC_HIDE_LOADING === "true" ||
    pathname === "/egg" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/explore/games");

  // Keep identical initial state on both SSR and client to prevent hydration mismatch
  const [isInitialLoading, setIsInitialLoading] = useState(!hideLoading);

  useEffect(() => {
    // Embedded in the mobile app's WebView (?app=true) or explicitly hidden routes
    if (hideLoading || isInApp()) {
      setIsInitialLoading(false);
      return;
    }

    // Simulate initial loading time for main web visitors
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [hideLoading]);

  return <LoadingScreen isLoading={isInitialLoading}>{children}</LoadingScreen>;
}
