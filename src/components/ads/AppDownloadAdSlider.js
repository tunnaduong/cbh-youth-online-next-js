"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// Slide 1: Banner tải app mobile
function AppDownloadSlide({ onClose }) {
  return (
    <div className="relative w-full">
      <a href="https://chuyenbienhoa.download?utm_source=cyo_home">
        <Image
          src="/images/mobile-app-download-banner.webp"
          alt="Tải ứng dụng Chuyên Biên Hòa Online"
          width={1200}
          height={400}
          className="w-full h-auto"
          priority
        />
      </a>
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-2 right-2 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        style={{
          width: "32px",
          height: "32px",
          fontSize: "16px",
          lineHeight: 1,
          border: "none",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

// Slide 2: Banner 468x60
function AdBannerSlide() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = "468";
    iframe.height = "60";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.maxWidth = "100%";
    iframe.scrolling = "no";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '48cd595d5561928deaed61ec924bfad7',
      'format' : 'iframe',
      'height' : 60,
      'width' : 468,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://bicea.org/22/48cd595d5561928deaed61ec924bfad7"></script>
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

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 px-2 bg-gray-50 dark:bg-neutral-800 min-h-[90px] border border-gray-100 dark:border-neutral-700 rounded-lg">
      <div className="w-full flex justify-center items-center overflow-x-auto">
        <div ref={containerRef} className="flex justify-center items-center max-w-full overflow-hidden" style={{ minWidth: "300px", minHeight: "60px" }} />
      </div>
      <span className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
        Quảng cáo
      </span>
    </div>
  );
}

export default function AppDownloadAdSlider({ onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const totalSlides = 2;

  const goTo = useCallback(
    (index) => {
      setActiveIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    },
    [totalSlides]
  );

  // Auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  // --- Touch ---
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
    setDragging(true);
    setDragOffset(0);
  };
  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    setDragOffset(e.touches[0].clientX - dragStart);
  };
  const handleTouchEnd = () => {
    if (Math.abs(dragOffset) > 40) {
      goTo(activeIndex + (dragOffset < 0 ? 1 : -1));
    }
    setDragStart(null);
    setDragging(false);
    setDragOffset(0);
  };

  // --- Mouse ---
  const handleMouseDown = (e) => {
    setDragStart(e.clientX);
    setDragging(true);
    setDragOffset(0);
  };
  const handleMouseMove = (e) => {
    if (!dragging || dragStart === null) return;
    setDragOffset(e.clientX - dragStart);
  };
  const handleMouseUp = () => {
    if (Math.abs(dragOffset) > 40) {
      goTo(activeIndex + (dragOffset < 0 ? 1 : -1));
    }
    setDragStart(null);
    setDragging(false);
    setDragOffset(0);
  };

  const translateX =
    -(activeIndex * 100) +
    (dragging ? (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100 : 0);

  return (
    <div className="w-full">
      {/* Slider track */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg w-full cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {/* Slide 1 */}
          <div className="min-w-full">
            <AppDownloadSlide onClose={onClose} />
          </div>
          {/* Slide 2: Chỉ banner 468x60 */}
          <div className="min-w-full">
            <AdBannerSlide />
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-2 mb-1">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-5 h-2 bg-primary-500"
                : "w-2 h-2 bg-gray-300 dark:bg-neutral-600"
            }`}
            style={{ border: "none", padding: 0, cursor: "pointer" }}
          />
        ))}
      </div>
    </div>
  );
}
