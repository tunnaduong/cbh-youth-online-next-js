"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isInApp } from "@/utils/appMode";

export default function Ad300x250({ className = "" }) {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isInApp() || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = "300";
    iframe.height = "250";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.maxWidth = "100%";
    iframe.scrolling = "no";
    iframe.loading = "lazy";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : 'ddebc5ab971d5273d0fb5a79cbbfe198',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/ddebc5ab971d5273d0fb5a79cbbfe198/invoke.js"></script>
</body>
</html>`;

    container.appendChild(iframe);
    try {
      const doc = iframe.contentWindow || iframe.contentDocument;
      if (doc.document) {
        doc.document.open();
        doc.document.write(html);
        doc.document.close();
      } else {
        doc.open();
        doc.write(html);
        doc.close();
      }
    } catch {
      iframe.srcdoc = html;
    }
  }, []);

  if (!mounted || isInApp()) return null;

  return (
    <div
      className={`rounded-2xl border border-[#EBEFEA] bg-white p-3.5 shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)] flex flex-col items-center ${className}`}
    >
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          Quảng cáo
        </span>
        <Link
          href="/ads"
          className="text-xs text-primary-600 hover:underline dark:text-primary-400 font-medium"
        >
          Liên hệ đặt chỗ
        </Link>
      </div>

      {/* 300x250 Banner Container */}
      <div
        className="flex justify-center items-center overflow-hidden my-1 w-full"
        style={{ minHeight: "250px" }}
      >
        <div ref={containerRef} className="w-[300px] h-[250px] flex justify-center items-center max-w-full" />
      </div>

      {/* Info footer */}
      <div className="w-full mt-2 pt-2 border-t border-gray-100 dark:border-neutral-600 text-center">
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          Vị trí nổi bật bên cạnh bảng xếp hạng.{" "}
          <a
            href="mailto:ads@chuyenbienhoa.com"
            className="text-primary-600 hover:underline dark:text-primary-400 font-medium"
          >
            ads@chuyenbienhoa.com
          </a>
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Link
            href="/ads"
            className="inline-flex h-7 items-center rounded-lg bg-primary-500 px-3 text-xs font-medium !text-white hover:bg-primary-600 transition-colors"
          >
            Tìm hiểu thêm
          </Link>
          <a
            href="https://www.profitableratecpmnetwork.com/f7kk39xjy?key=f33af904ae5ae82d5956b5aeb20ed607"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center rounded-lg bg-gray-100 dark:bg-neutral-700 px-3 text-xs font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
          >
            Khám phá
          </a>
        </div>
      </div>
    </div>
  );
}
