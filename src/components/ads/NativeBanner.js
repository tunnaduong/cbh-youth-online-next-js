"use client";

import { useEffect, useRef } from "react";
import { isInApp } from "@/utils/appMode";

export default function NativeBanner({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isInApp() || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "210px";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.loading = "lazy";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="container-d75e1be3578406d08612b5cc3623fa29"></div>
  <script async="async" data-cfasync="false" src="https://pl32171519.profitableratecpmnetwork.com/d75e1be3578406d08612b5cc3623fa29/invoke.js"></script>
  <script>
    // Tự động điều chỉnh chiều cao iframe nếu quảng cáo có kích thước thực tế khác
    function checkHeight() {
      var h = document.body.scrollHeight;
      if (h > 50 && window.frameElement) {
        window.frameElement.style.height = h + 'px';
      }
    }
    window.addEventListener('load', checkHeight);
    setInterval(checkHeight, 1000);
  </script>
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

  if (isInApp()) return null;

  return (
    <div
      className={`rounded-xl bg-white p-3 dark:!bg-[var(--main-white)] long-shadow overflow-hidden ${className}`}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
        Nội dung được tài trợ
      </div>
      <div ref={containerRef} className="w-full min-h-[160px] flex justify-center" />
    </div>
  );
}
