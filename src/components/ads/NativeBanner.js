"use client";

import { useEffect, useRef } from "react";
import { isInApp } from "@/utils/appMode";

export default function NativeBanner({ className = "" }) {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (isInApp() || loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    try {
      const script = document.createElement("script");
      script.src =
        "https://pl32171519.profitableratecpmnetwork.com/d75e1be3578406d08612b5cc3623fa29/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      containerRef.current.appendChild(script);

      const adDiv = document.createElement("div");
      adDiv.id = "container-d75e1be3578406d08612b5cc3623fa29";
      containerRef.current.appendChild(adDiv);
    } catch {
      // ignore
    }
  }, []);

  if (isInApp()) return null;

  return (
    <div
      className={`rounded-xl bg-white p-3 dark:!bg-[var(--main-white)] long-shadow overflow-hidden ${className}`}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
        Nội dung được tài trợ
      </div>
      <div ref={containerRef} className="w-full min-h-[90px]" />
    </div>
  );
}
