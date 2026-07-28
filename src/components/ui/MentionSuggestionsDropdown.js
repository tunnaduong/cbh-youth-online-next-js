"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating dropdown that lists mention suggestions.
 * Rendered via a portal so parent overflow:hidden containers never clip it.
 *
 * @param {object}  props
 * @param {Array}   props.suggestions
 * @param {function} props.onSelect
 * @param {function} props.onClose
 * @param {React.RefObject} props.anchorRef - ref to the input/textarea to position relative to
 */
export default function MentionSuggestionsDropdown({ suggestions, onSelect, onClose, anchorRef }) {
  const [coords, setCoords] = useState(null);

  // Recompute position when suggestions appear or window scrolls/resizes
  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const updateCoords = () => {
      const el = anchorRef?.current?.resizableTextArea?.textArea
        || anchorRef?.current?.input
        || anchorRef?.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCoords({ top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height });
    };

    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [suggestions, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!suggestions || suggestions.length === 0 || !coords) return null;

  const DROPDOWN_MAX_H = 320; // max-h-80

  // Place above the input; if not enough space above, place below
  const spaceAbove = coords.top;
  const placeBelow = spaceAbove < DROPDOWN_MAX_H + 8;

  const style = placeBelow
    ? { position: "absolute", top: coords.top + coords.height + 4, left: coords.left, width: Math.max(coords.width, 256), zIndex: 9999 }
    : { position: "absolute", top: coords.top - 4, left: coords.left, width: Math.max(coords.width, 256), zIndex: 9999, transform: "translateY(-100%)" };

  const content = (
    <div
      style={style}
      className="max-h-80 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-xl"
    >
      {suggestions.map((user) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(e) => {
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

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
