"use client";

import { Image } from "antd";

// Facebook-style photo collage for a post's images, backed by antd's
// Image.PreviewGroup for the full-screen gallery (zoom, rotate, flip,
// prev/next, keyboard + touch).
//
// Row layout mirrors the collage the app used before: 1, 2 or 3 photos share a
// single row; 4+ photos render as 2 on top and 3 below, and when there are more
// than 5 the last tile carries a "+N" badge. The preview still covers EVERY
// image - the ones hidden behind the badge are reachable with prev/next - because
// the group receives the full list through `items`.
const MAX_VISIBLE = 5;

export default function PhotoCollage({ images, className = "" }) {
  const urls = (images || []).filter(Boolean);
  if (urls.length === 0) return null;

  const rows =
    urls.length <= 3 ? [urls] : [urls.slice(0, 2), urls.slice(2, MAX_VISIBLE)];
  const visibleCount = Math.min(urls.length, MAX_VISIBLE);
  const remaining = urls.length - visibleCount;

  return (
    <Image.PreviewGroup items={urls}>
      <div className={`flex w-full flex-col gap-[2px] aspect-[10/7] ${className}`}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            // Two-row layout keeps the old 60/40 split; single row fills it all.
            className={`flex min-h-0 gap-[2px] ${
              rows.length === 1 ? "flex-1" : rowIndex === 0 ? "flex-[3]" : "flex-[2]"
            }`}
          >
            {row.map((url, colIndex) => {
              const index = rowIndex === 0 ? colIndex : rows[0].length + colIndex;
              const isLastVisible = index === visibleCount - 1;
              const showBadge = isLastVisible && remaining > 0;

              return (
                <div
                  key={`${index}-${url}`}
                  className="relative flex-1 min-w-0 overflow-hidden bg-gray-100 dark:bg-neutral-800"
                >
                  <Image
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    loading="lazy"
                    rootClassName="!block w-full h-full"
                    className="!w-full !h-full object-cover cursor-pointer transition-[filter] duration-200 hover:brightness-90"
                    placeholder={
                      <div className="w-full h-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                    }
                    preview={{ mask: false }}
                  />
                  {showBadge && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-white text-4xl font-medium">
                      +{remaining}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Image.PreviewGroup>
  );
}
