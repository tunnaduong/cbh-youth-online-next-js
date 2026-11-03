"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// Slide 1: banner tải app mobile
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
        className="absolute top-2 right-2 flex items-center justify-center bg-black/50 text-white rounded-full"
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

// Slide 2: quảng cáo 468x60 + NativeBanner
function AdBannerSlide() {
  const banner468Ref = useRef(null);
  const nativeBannerRef = useRef(null);
  const banner468Loaded = useRef(false);
  const nativeBannerLoaded = useRef(false);

  useEffect(() => {
    // Load 468x60 banner ad
    if (!banner468Loaded.current && banner468Ref.current) {
      banner468Loaded.current = true;
      try {
        window.atOptions = {
          key: "48cd595d5561928deaed61ec924bfad7",
          format: "iframe",
          height: 60,
          width: 468,
          params: {},
        };
        const script = document.createElement("script");
        script.src = "https://bicea.org/22/48cd595d5561928deaed61ec924bfad7";
        script.async = true;
        banner468Ref.current.appendChild(script);
      } catch (e) {
        // ignore ad errors
      }
    }

    // Load NativeBanner ad
    if (!nativeBannerLoaded.current && nativeBannerRef.current) {
      nativeBannerLoaded.current = true;
      try {
        const script = document.createElement("script");
        script.src =
          "https://pl32171519.profitableratecpmnetwork.com/d75e1be3578406d08612b5cc3623fa29/invoke.js";
        script.async = true;
        script.setAttribute("data-cfasync", "false");
        nativeBannerRef.current.appendChild(script);

        const container = document.createElement("div");
        container.id = "container-d75e1be3578406d08612b5cc3623fa29";
        nativeBannerRef.current.appendChild(container);
      } catch (e) {
        // ignore ad errors
      }
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-3 px-2 bg-gray-50 dark:bg-neutral-800 min-h-[120px]">
      {/* 468x60 Banner */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ maxWidth: "468px", width: "100%", minHeight: "60px" }}
      >
        <div ref={banner468Ref} style={{ maxWidth: "100%", overflow: "hidden" }} />
      </div>
      {/* NativeBanner */}
      <div className="w-full" ref={nativeBannerRef} />
      <p className="text-[10px] text-gray-400 dark:text-neutral-500">Quảng cáo</p>
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

  const translateX = -(activeIndex * 100) + (dragging ? (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100 : 0);

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
          {/* Slide 2 */}
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
