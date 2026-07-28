"use client";

import { useEffect, useRef } from "react";

/**
 * Floating dropdown that lists mention suggestions. Appears below the
 * textarea; the caller is responsible for positioning via a wrapper div.
 */
export default function MentionSuggestionsDropdown({ suggestions, onSelect, onClose }) {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = [0, () => {}]; // kept simple — keyboard nav below

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute z-50 bottom-full mb-1 left-0 w-64 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-lg"
    >
      {suggestions.map((user) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(e) => {
            // mousedown fires before textarea blur — prevent the textarea from
            // losing focus so selection cursor position stays accurate.
            e.preventDefault();
            onSelect(user);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <img
            src={user.avatar_url || `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user.username}/avatar`}
            alt={user.profile_name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.profile_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
