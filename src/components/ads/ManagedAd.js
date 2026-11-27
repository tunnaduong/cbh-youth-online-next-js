"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isInApp } from "@/utils/appMode";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

// Cache per placement for the page session so every slot doesn't refetch.
const cache = {};
function loadAds(placement) {
  if (!cache[placement]) {
    cache[placement] = fetch(`${API}/v1.0/ads?placement=${encodeURIComponent(placement)}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return cache[placement];
}

function track(id, type) {
  try {
    fetch(`${API}/v1.0/ads/${id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      keepalive: true,
    });
  } catch {}
}

/**
 * Shows an ad managed in /admin/ads for `placement`. While loading, or when no
 * live ad exists, renders `fallback` (e.g. the Adsterra network unit).
 */
export default function ManagedAd({ placement, fallback = null, className = "" }) {
  const [state, setState] = useState({ loaded: false, ad: null });

  useEffect(() => {
    if (isInApp()) return;
    let alive = true;
    loadAds(placement).then((ads) => {
      if (!alive) return;
      const list = Array.isArray(ads) ? ads : ads?.data || [];
      let ad = null;
      if (list.length) {
        const top = Math.max(...list.map((a) => a.priority || 0));
        const best = list.filter((a) => (a.priority || 0) === top);
        ad = best[Math.floor(Math.random() * best.length)];
        track(ad.id, "impression");
      }
      setState({ loaded: true, ad });
    });
    return () => {
      alive = false;
    };
  }, [placement]);

  if (!state.loaded) return null;
  if (!state.ad) return fallback;

  const { ad } = state;
  const external = ad.link_url && /^https?:/.test(ad.link_url);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ad.image_url} alt={ad.alt_text || ad.name} className="w-full h-auto rounded-xl" loading="lazy" />
  );

  return (
    <div
      className={`rounded-2xl border border-[#EBEFEA] bg-white p-3.5 shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)] ${className}`}
    >
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          Quảng cáo
        </span>
        <Link href="/ads" className="text-xs text-primary-600 hover:underline dark:text-primary-400 font-medium">
          Liên hệ đặt chỗ
        </Link>
      </div>
      {ad.link_url ? (
        <a
          href={ad.link_url}
          onClick={() => track(ad.id, "click")}
          {...(external ? { target: "_blank", rel: "sponsored noopener noreferrer" } : {})}
          className="block"
        >
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}
