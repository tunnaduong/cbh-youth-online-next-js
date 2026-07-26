"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function ChatMediaLightbox({ media, onClose }) {
  useEffect(() => {
    if (!media) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [media, onClose]);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        title="Đóng"
      >
        <X className="w-6 h-6" />
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        {media.type === "image" ? (
          <img
            src={media.url}
            alt="preview"
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        ) : media.type === "video" ? (
          <video
            src={media.url}
            poster={media.poster}
            controls
            autoPlay
            className="max-w-[95vw] max-h-[95vh]"
          />
        ) : null}
      </div>
    </div>
  );
}
