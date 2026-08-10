"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./ui/LoadingScreen";

export default function LoadingWrapper({ children }) {
  const pathname = usePathname();

  // Check if loading should be hidden via environment variable or on /egg
  const hideLoading = process.env.NEXT_PUBLIC_HIDE_LOADING === "true" || pathname === "/egg";

  // Initialize state based on environment variable to prevent flash
  const [isInitialLoading, setIsInitialLoading] = useState(!hideLoading);

  useEffect(() => {
    // Embedded in the mobile app's WebView (?app=true) - the app already
    // shows its own native splash, so a second web one is just a flash of a
    // duplicate loading screen. Checked client-side only (window isn't
    // available during SSR) so it can't cause a hydration mismatch.
    const isInApp = new URLSearchParams(window.location.search).get("app") === "true";

    if (hideLoading || isInApp) {
      setIsInitialLoading(false);
      return;
    }

    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500); // 2.5 seconds loading time

    return () => clearTimeout(timer);
  }, [hideLoading]);

  return <LoadingScreen isLoading={isInitialLoading}>{children}</LoadingScreen>;
}
