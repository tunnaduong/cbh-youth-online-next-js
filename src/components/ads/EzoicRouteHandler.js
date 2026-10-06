"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EZOIC_ENABLED, runEzoic } from "@/lib/ezoic";

// App Router navigations don't reload the page, so re-request ads per route.
export default function EzoicRouteHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (!EZOIC_ENABLED) return;
    runEzoic(() => {
      window.ezstandalone?.destroyPlaceholders();
      requestAnimationFrame(() => window.ezstandalone?.showAds());
    });
  }, [pathname]);

  return null;
}
