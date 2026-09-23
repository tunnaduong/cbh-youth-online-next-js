"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Link2, Music } from "lucide-react";
import {
  denormalizeOverlayItem,
  getContainedStoryBox,
  STORY_FONT_CSS,
  getTextEffectStyle,
} from "@/lib/storyOverlays";

/**
 * Draws a story's overlay items over the media.
 *
 * Photo stories arrive with their overlays already flattened into the picture
 * (that is what the mobile editor uploads), so those are rendered invisibly
 * and only serve as click targets for the mention and link stickers. Video
 * stories keep their overlays live, exactly like in the app.
 */
const chipClasses = (style) =>
  style === "dark"
    ? "bg-black/55 text-white"
    : "bg-white/90 text-neutral-900";

const StoryOverlayLayer = ({ overlays }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const items = overlays?.items || [];

  if (!items.length) {
    return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
  }

  const box = getContainedStoryBox(size.width, size.height);
  const hidden = Boolean(overlays?.flattened);
  const chipFontSize = Math.round(box.width * 0.042) || 12;

  return (
    <div ref={containerRef} className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="absolute"
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      >
        {items.map((rawItem, index) => {
          const item = denormalizeOverlayItem(rawItem, box, index);
          const wrapperStyle = {
            position: "absolute",
            left: item.x,
            top: item.y,
            transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
            transformOrigin: "center",
            opacity: hidden ? 0 : 1,
          };

          if (item.type === "text") {
            const hasBackground = item.effect === "background";

            return (
              <div key={item.key} style={wrapperStyle}>
                <div
                  style={{
                    width: item.width,
                    color: hasBackground ? "#111111" : item.color,
                    fontSize: item.fontSize,
                    lineHeight: 1.25,
                    textAlign: item.align,
                    fontFamily: STORY_FONT_CSS[item.font] || STORY_FONT_CSS.classic,
                    fontWeight: 800,
                    whiteSpace: "pre-wrap",
                    ...getTextEffectStyle(item.effect, item.color),
                    ...(hasBackground
                      ? {
                          background: item.color,
                          padding: `${item.fontSize * 0.18}px ${item.fontSize * 0.35}px`,
                          borderRadius: item.fontSize * 0.3,
                        }
                      : {}),
                  }}
                >
                  {item.text}
                </div>
              </div>
            );
          }

          if (item.type === "sticker") {
            return (
              <div key={item.key} style={wrapperStyle}>
                <span style={{ fontSize: item.width, lineHeight: 1.2 }}>{item.emoji}</span>
              </div>
            );
          }

          if (item.type === "mention") {
            return (
              <div key={item.key} style={{ ...wrapperStyle, pointerEvents: "auto" }}>
                <Link
                  href={`/${item.username}`}
                  className={`flex items-center rounded-full font-bold ${chipClasses(item.style)}`}
                  style={{
                    fontSize: chipFontSize,
                    padding: `${chipFontSize * 0.32}px ${chipFontSize * 0.6}px`,
                  }}
                >
                  @{item.username}
                </Link>
              </div>
            );
          }

          if (item.type === "link") {
            return (
              <div key={item.key} style={{ ...wrapperStyle, pointerEvents: "auto" }}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`flex items-center gap-1 rounded-full font-bold ${chipClasses(item.style)}`}
                  style={{
                    fontSize: chipFontSize,
                    padding: `${chipFontSize * 0.32}px ${chipFontSize * 0.6}px`,
                  }}
                >
                  <Link2 size={chipFontSize} />
                  <span className="truncate" style={{ maxWidth: box.width * 0.6 }}>
                    {item.label || item.url.replace(/^https?:\/\//i, "")}
                  </span>
                </a>
              </div>
            );
          }

          if (item.type === "music") {
            return (
              <div key={item.key} style={wrapperStyle}>
                <div
                  className={`flex items-center gap-2 rounded-full font-bold ${chipClasses(item.style)}`}
                  style={{
                    fontSize: chipFontSize,
                    padding: `${chipFontSize * 0.3}px ${chipFontSize * 0.5}px`,
                  }}
                >
                  {item.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.artworkUrl}
                      alt=""
                      style={{
                        width: chipFontSize * 1.6,
                        height: chipFontSize * 1.6,
                        borderRadius: chipFontSize * 0.3,
                      }}
                    />
                  ) : (
                    <Music size={chipFontSize} />
                  )}
                  <span className="flex flex-col" style={{ maxWidth: box.width * 0.55 }}>
                    <span className="truncate">{item.title}</span>
                    {!!item.artist && (
                      <span className="truncate font-normal opacity-75" style={{ fontSize: chipFontSize * 0.82 }}>
                        {item.artist}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default StoryOverlayLayer;
