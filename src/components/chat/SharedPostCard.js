"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Compact preview of a forum post: used both in the share modal (so the sender
 * sees what they're about to send) and inside a chat bubble (so the recipient
 * sees the post instead of a bare link).
 *
 * @param {object} props
 * @param {object} props.topic - { id, title, url, excerpt, thumbnail, author_name, author_avatar }
 * @param {boolean} [props.compact] - tighter layout, for chat bubbles
 */
export default function SharedPostCard({ topic, compact = false }) {
  if (!topic) return null;

  // Links to our own site stay in-app (client-side route); anything else -
  // e.g. a message shared from another deployment - opens normally.
  let href = topic.url || "#";
  let isInternal = false;
  try {
    const parsed = new URL(topic.url);
    if (
      typeof window !== "undefined" &&
      parsed.origin === window.location.origin
    ) {
      href = parsed.pathname + parsed.search;
      isInternal = true;
    }
  } catch (error) {
    // Not an absolute URL - leave it as-is.
  }

  const card = (
    <div
      className={`rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-500 bg-white dark:bg-neutral-700 hover:border-gray-300 dark:hover:border-neutral-400 transition-colors ${
        // In a chat bubble the parent is w-fit, so without a floor the card
        // collapses to the width of a short title.
        compact ? "min-w-[200px]" : ""
      }`}
    >
      {topic.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={topic.thumbnail}
          alt=""
          className={`w-full object-cover ${compact ? "h-28" : "h-36"}`}
        />
      )}
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
          {topic.title || "(Chưa có tiêu đề)"}
        </p>
        {topic.excerpt && (
          <p
            className={`text-xs text-gray-500 dark:text-gray-300 mt-1 ${
              compact ? "line-clamp-2" : "line-clamp-3"
            }`}
          >
            {topic.excerpt}
          </p>
        )}
        {topic.author_name && (
          <div className="flex items-center gap-1.5 mt-2 min-w-0">
            <Avatar className="w-4 h-4 flex-shrink-0">
              <AvatarImage src={topic.author_avatar} alt="" />
              <AvatarFallback className="text-[8px]">
                {topic.author_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 dark:text-gray-300 truncate">
              {topic.author_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (isInternal) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {card}
    </a>
  );
}
