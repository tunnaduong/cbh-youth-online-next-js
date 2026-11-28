"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Modal } from "antd";
import { ShieldAlert } from "lucide-react";
import { isChatLite, isInApp } from "@/utils/appMode";

const DISMISS_STORAGE_KEY = "cbh_adblock_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ
const INITIAL_CHECK_DELAY_MS = 1500;

const SUPPRESSED_PREFIXES = [
  "/admin",
  "/shop",
  "/login",
  "/register",
  "/auth",
  "/password",
  "/email",
  "/egg",
];

function isSuppressedRoute(pathname) {
  if (!pathname) return false;
  if (
    SUPPRESSED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  // Tránh che iframe khi đang chơi game
  if (/^\/explore\/games\/[^/]+/.test(pathname)) return true;
  return false;
}

function isRecentlyDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra bộ lọc ẩn phần tử quảng cáo (cosmetic filtering) của uBlock Origin,
 * AdBlock, AdBlock Plus, AdGuard, Safari Content Blocker...
 */
function checkCosmeticBait() {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !document.body) {
      resolve(false);
      return;
    }

    const bait = document.createElement("div");
    bait.className =
      "pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links adsbox ad-banner";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText =
      "position:fixed;top:-10px;left:-10px;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    bait.innerHTML = "&nbsp;";
    document.body.appendChild(bait);

    window.setTimeout(() => {
      let blocked = false;
      try {
        if (!bait.isConnected) {
          blocked = true;
        } else {
          const style = window.getComputedStyle(bait);
          const rect = bait.getBoundingClientRect();
          blocked =
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0" ||
            bait.offsetHeight === 0 ||
            bait.clientHeight === 0 ||
            rect.height === 0 ||
            bait.getAttribute("abp") !== null;
        }
      } catch {
        blocked = false;
      } finally {
        bait.remove();
      }
      resolve(blocked);
    }, 200);
  });
}

async function probeUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return "ok";
  } catch (err) {
    if (err?.name === "AbortError") return "timeout";
    return "error";
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Kiểm tra bộ lọc chặn tên miền quảng cáo ở tầng mạng (Brave Shields, Pi-hole,
 * NextDNS, extension chặn request). Khi request quảng cáo bị lỗi, xác minh lại
 * kết nối mạng bằng endpoint không phải quảng cáo để tránh báo nhầm khi mất mạng.
 */
async function checkNetworkBait() {
  if (typeof window === "undefined" || navigator.onLine === false) {
    return false;
  }

  // Script AdSense từ GlobalAds đã tải thành công
  if (window.adsbygoogle && window.adsbygoogle.loaded) {
    return false;
  }

  const adResult = await probeUrl(
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
    3500
  );
  if (adResult !== "error") return false;
  if (navigator.onLine === false) return false;

  const connectivityResult = await probeUrl(
    "https://www.gstatic.com/generate_204",
    3000
  );
  return connectivityResult === "ok";
}

async function detectAdBlocker() {
  const cosmeticBlocked = await checkCosmeticBait();
  if (cosmeticBlocked) return true;
  return checkNetworkBait();
}

/**
 * Popup nhắc người dùng tắt trình chặn quảng cáo.
 * Ẩn trong app WebView (?app=true), các trang /admin, /shop, đăng nhập/đăng ký
 * và ghi nhớ lựa chọn "Không, cảm ơn" trong 24 giờ.
 */
export default function AdBlockerModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reloading, setReloading] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (isInApp() || isChatLite() || isSuppressedRoute(pathname)) {
      setOpen(false);
      return undefined;
    }

    if (hasCheckedRef.current || isRecentlyDismissed()) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled || hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      const blocked = await detectAdBlocker();
      if (!cancelled && blocked && !isRecentlyDismissed()) {
        setOpen(true);
      }
    }, INITIAL_CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  const handleDisabled = () => {
    setReloading(true);
    try {
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {}
    window.location.reload();
  };

  const handleDismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {}
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      centered
      footer={null}
      onCancel={handleDismiss}
      width={420}
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-[#2b3a2a]">
          <ShieldAlert className="h-6 w-6 text-primary-500 dark:text-[#6bcf60]" />
        </span>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          Bạn đang dùng trình chặn quảng cáo
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Quảng cáo góp phần duy trì website hoạt động miễn phí cho cộng đồng
          học sinh Chuyên Biên Hòa. Hãy tắt trình chặn quảng cáo để ủng hộ chúng
          mình nhé!
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-center text-xs leading-relaxed text-gray-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-400">
        Nhấn vào biểu tượng trình chặn quảng cáo trên thanh địa chỉ, chọn tạm
        dừng cho trang này rồi bấm{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          Tôi đã tắt
        </span>
        .
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={reloading}
          onClick={handleDisabled}
        >
          Tôi đã tắt
        </Button>
        <Button block disabled={reloading} onClick={handleDismiss}>
          Không, cảm ơn
        </Button>
      </div>
    </Modal>
  );
}
