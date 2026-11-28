"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isInApp } from "@/utils/appMode";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";
const AUTO_PLAY_MS = 5000;

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
 * Shows ads managed in /admin/ads for `placement`. When multiple active ads
 * exist for the same placement, displays them as an auto-sliding carousel
 * (ordered by priority desc). While loading, or when no live ad exists,
 * renders `fallback` (e.g. the Adsterra network unit).
 */
export default function ManagedAd({ placement, fallback = null, className = "" }) {
  const [state, setState] = useState({ loaded: false, ads: [] });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackedIdsRef = useRef(new Set());

  useEffect(() => {
    if (isInApp()) return;
    let alive = true;
    loadAds(placement).then((ads) => {
      if (!alive) return;
      const raw = Array.isArray(ads) ? ads : ads?.data || [];
      const list = raw.filter((a) => a && a.image_url);
      setIndex(0);
      setState({ loaded: true, ads: list });
    });
    return () => {
      alive = false;
    };
  }, [placement]);

  // Track impression once per slide when it becomes the active slide.
  useEffect(() => {
    const current = state.ads[index];
    if (current?.id && !trackedIdsRef.current.has(current.id)) {
      trackedIdsRef.current.add(current.id);
      track(current.id, "impression");
    }
  }, [state.ads, index]);

  // Auto-advance carousel when multiple creatives exist.
  useEffect(() => {
    if (state.ads.length <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setIndex((prev) => (prev + 1) % state.ads.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [state.ads.length, paused]);

  if (!state.loaded) return null;
  if (state.ads.length === 0) return fallback;

  const isCarousel = state.ads.length > 1;
  const goPrev = () => setIndex((prev) => (prev - 1 + state.ads.length) % state.ads.length);
  const goNext = () => setIndex((prev) => (prev + 1) % state.ads.length);

  return (
    <div
      className={`rounded-2xl border border-[#EBEFEA] bg-white p-3.5 shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)] ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          Quảng cáo
        </span>
        <Link href="/ads" className="text-xs text-primary-600 hover:underline dark:text-primary-400 font-medium">
          Liên hệ đặt chỗ
        </Link>
      </div>

      <div className="relative group overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {state.ads.map((ad, idx) => {
            const external = ad.link_url && /^https?:/.test(ad.link_url);
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.image_url}
                alt={ad.alt_text || ad.name}
                className="w-full h-auto block rounded-xl"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            );
            return (
              <div key={ad.id ?? idx} className="w-full shrink-0">
                {ad.link_url ? (
                  <a
                    href={ad.link_url}
                    onClick={() => ad.id && track(ad.id, "click")}
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
          })}
        </div>

        {isCarousel ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Quảng cáo trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Quảng cáo tiếp theo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/70"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full">
              {state.ads.map((ad, idx) => (
                <button
                  key={ad.id ?? idx}
                  type="button"
                  onClick={() => setIndex(idx)}
                  aria-label={`Xem quảng cáo ${idx + 1}/${state.ads.length}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === index ? "w-3.5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
