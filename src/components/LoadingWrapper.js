"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./ui/LoadingScreen";

export default function LoadingWrapper({ children }) {
  // Check if loading should be hidden via environment variable
  const hideLoading = process.env.NEXT_PUBLIC_HIDE_LOADING === "true";

  // Initialize state based on environment variable to prevent flash
  const [isInitialLoading, setIsInitialLoading] = useState(!hideLoading);

  useEffect(() => {
    if (hideLoading) {
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
