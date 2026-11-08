"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import EzoicRouteHandler from "./EzoicRouteHandler";
import { EZOIC_ENABLED } from "@/lib/ezoic";
import { isInApp } from "@/utils/appMode";

/**
 * Manages third-party advertising scripts (Google AdSense, SocialBar, Ezoic).
 *
 * Ad scripts are strictly suppressed on:
 * - Admin routes (/admin/*)
 * - Gift shop routes (/shop/*)
 * - Mobile app WebViews (isInApp() / ?app=true / CBHYouthApp user agent)
 *
 * This prevents intrusive popups, banners, and compositor flickering inside
 * the admin dashboard and mobile app views.
 */
export default function GlobalAds() {
  const pathname = usePathname();
  const [canLoadAds, setCanLoadAds] = useState(false);

  useEffect(() => {
    const isAdmin = pathname?.startsWith("/admin");
    const isShop = pathname?.startsWith("/shop");
    const inApp = isInApp();

    if (isAdmin || isShop || inApp) {
      setCanLoadAds(false);
      // Clean up any dynamic ad containers or overlays injected by ad networks
      try {
        const adElements = document.querySelectorAll(
          "[id*='bicea'], .bicea, ins.adsbygoogle, iframe[src*='highrevenueformat'], iframe[src*='profitableratecpmnetwork']"
        );
        adElements.forEach((el) => {
          if (!el.closest("nav") && !el.closest("header")) {
            el.remove();
          }
        });
      } catch (e) {
        // Safe ignore
      }
      return;
    }

    setCanLoadAds(true);
  }, [pathname]);

  if (!canLoadAds) return null;

  return (
    <>
      {EZOIC_ENABLED ? (
        <EzoicRouteHandler />
      ) : (
        <>
          {/* Google Adsense */}
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3425905751761094"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <Script
            id="adsense"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9033651898132595"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          {/* SocialBar Ad */}
          <Script
            src="https://bicea.org/14/7340e87d9ddbe42b3695cd5cd119ca77"
            strategy="afterInteractive"
            data-cfasync="false"
          />
        </>
      )}
    </>
  );
}
