"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

export default function ChatMediaLightbox({ media, onClose }) {
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragStart = useRef(null);

  useEffect(() => {
    if (!media) return;
    setScale(1);
    setPos({ x: 0, y: 0 });
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 4));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.25));
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [media, onClose]);

  if (!media) return null;

  const handleWheel = (e) => {
    e.preventDefault();
    setScale((s) => Math.min(Math.max(s - e.deltaY * 0.001, 0.25), 4));
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center overflow-hidden"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        title="Đóng (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom controls */}
      {media.type === "image" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(s - 0.25, 0.25)); }}
            className="p-1 text-white hover:text-gray-300 transition-colors"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white text-xs min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(s + 0.25, 4)); }}
            className="p-1 text-white hover:text-gray-300 transition-colors"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setScale(1); setPos({ x: 0, y: 0 }); }}
            className="text-white text-xs hover:text-gray-300 transition-colors ml-1"
            title="Đặt lại"
          >
            1:1
          </button>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "center center",
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
          transition: dragging ? "none" : "transform 0.1s ease",
        }}
      >
        {media.type === "image" ? (
          <img
            src={media.url}
            alt="preview"
            draggable={false}
            style={{ maxWidth: "90vw", maxHeight: "90vh", display: "block" }}
          />
        ) : media.type === "video" ? (
          <video
            src={media.url}
            poster={media.poster}
            controls
            autoPlay
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
          />
        ) : null}
      </div>
    </div>
  );
}
