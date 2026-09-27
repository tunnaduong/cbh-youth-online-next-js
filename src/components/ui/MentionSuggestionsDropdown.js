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
  const [activeIndex, setActiveIndex] = useState(0);
  // The keydown listener is registered once per suggestion list, so it would
  // otherwise close over a stale activeIndex. Mirror it in a ref.
  const activeIndexRef = useRef(0);
  const listRef = useRef(null);

  // Callers pass inline arrows, so these change identity on every render -
  // keeping them in refs stops the listener from resubscribing constantly.
  const onSelectRef = useRef(onSelect);
  const onCloseRef = useRef(onClose);
  onSelectRef.current = onSelect;
  onCloseRef.current = onClose;

  const setActive = (i) => {
    activeIndexRef.current = i;
    setActiveIndex(i);
  };

  // A freshly filtered list must not keep a highlight pointing past its end.
  useEffect(() => {
    setActive(0);
  }, [suggestions]);

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

  // Keyboard navigation. Registered in the CAPTURE phase on document so it
  // runs before the composer's own React onKeyDown - otherwise Enter would
  // reach the editor first and insert a newline (or auto-continue a markdown
  // list) before we could claim the key for picking a suggestion.
  useEffect(() => {
    const count = suggestions?.length ?? 0;
    if (count === 0) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      // Mid-composition keys belong to the IME, not to us.
      if (e.isComposing || e.keyCode === 229) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        const i = activeIndexRef.current;
        setActive(e.key === "ArrowDown" ? (i + 1) % count : (i - 1 + count) % count);
        return;
      }

      // Enter and Tab both commit the highlighted suggestion, the way most
      // editors behave. Modified Enter (Ctrl/Cmd+Enter submits a comment) is
      // left alone so it still reaches the composer.
      if ((e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) || e.key === "Tab") {
        const user = suggestions[activeIndexRef.current];
        if (!user) return;
        e.preventDefault();
        e.stopPropagation();
        onSelectRef.current?.(user);
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [suggestions]);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    listRef.current?.children?.[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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
      ref={listRef}
      style={style}
      className="max-h-80 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-xl"
    >
      {/* onMouseEnter moves the highlight too, so the mouse and the keyboard
          never disagree about which row Enter would pick. */}
      {suggestions.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          onMouseEnter={() => setActive(index)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
            index === activeIndex ? "bg-gray-100 dark:bg-neutral-700" : ""
          }`}
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
