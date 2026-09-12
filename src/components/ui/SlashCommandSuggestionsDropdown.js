"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating dropdown listing the /ai and /summary commands, mirroring
 * MentionSuggestionsDropdown's portal/positioning approach.
 *
 * @param {object}  props
 * @param {Array}   props.suggestions - [{ command, description }]
 * @param {function} props.onSelect
 * @param {function} props.onClose
 * @param {React.RefObject} props.anchorRef
 */
export default function SlashCommandSuggestionsDropdown({ suggestions, onSelect, onClose, anchorRef }) {
  const [coords, setCoords] = useState(null);

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

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!suggestions || suggestions.length === 0 || !coords) return null;

  const DROPDOWN_MAX_H = 200;
  const spaceAbove = coords.top;
  const placeBelow = spaceAbove < DROPDOWN_MAX_H + 8;

  const style = placeBelow
    ? { position: "absolute", top: coords.top + coords.height + 4, left: coords.left, width: Math.max(coords.width, 256), zIndex: 9999 }
    : { position: "absolute", top: coords.top - 4, left: coords.left, width: Math.max(coords.width, 256), zIndex: 9999, transform: "translateY(-100%)" };

  const content = (
    <div
      style={style}
      className="max-h-48 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-xl"
    >
      {suggestions.map((item) => (
        <button
          key={item.command}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            {item.command}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
