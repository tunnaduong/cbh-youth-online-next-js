"use client";

import { useEffect, useState } from "react";
import { getActiveAds } from "@/data/ads";
import { isInApp } from "@/utils/appMode";

// Renders one creative for `slot`. Picks it in useEffect so the server render
// matches; hidden inside the mobile app, which owns its own ad policy.
export default function AdSlot({ slot, className = "" }) {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    if (isInApp()) return;
    const ads = getActiveAds(slot);
    if (ads.length) setAd(ads[Math.floor(Math.random() * ads.length)]);
  }, [slot]);

  if (!ad) return null;
  const external = /^https?:/.test(ad.href);

  return (
    <a
      href={ad.href}
      {...(external ? { target: "_blank", rel: "sponsored noopener noreferrer" } : {})}
      className={`block rounded-xl bg-white p-3 text-sm long-shadow transition-colors hover:bg-gray-50 dark:!bg-[var(--main-white)] dark:hover:bg-neutral-700 ${className}`}
    >
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-neutral-500">
        {ad.sponsor ? "Tài trợ" : "Quảng cáo"}
      </div>
      <div className="flex gap-3">
        {ad.image && (
          <img src={ad.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0">
          <div className="font-bold text-gray-900 dark:text-neutral-100">{ad.title}</div>
          <div className="text-gray-600 dark:text-neutral-300">{ad.description}</div>
          <span className="mt-2 inline-flex h-8 items-center rounded-xl bg-primary-500 px-3 text-xs font-semibold !text-white">
            {ad.cta}
          </span>
        </div>
      </div>
    </a>
  );
}
