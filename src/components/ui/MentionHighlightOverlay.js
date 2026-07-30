"use client";

import { useLayoutEffect, useRef } from "react";

const MENTION_RE = /(@[\w\-À-ɏ]+)/gu;

// Style props copied from the real input so the overlay text lines up exactly
// on top of it (font, spacing, padding, wrapping all have to match).
const MIRRORED_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "textAlign",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "boxSizing",
  "wordSpacing",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
  "tabSize",
];

function resolveInputEl(ref) {
  return (
    ref?.current?.resizableTextArea?.textArea ||
    ref?.current?.input ||
    ref?.current
  );
}

/**
 * Renders @mention tokens as bold + underlined text on top of a plain
 * textarea/input, so mentions are visually distinguishable while typing
 * (the underlying form control keeps its text transparent so only this
 * overlay's text is visible).
 *
 * @param {object} props
 * @param {string} props.text - current input value
 * @param {React.RefObject} props.targetRef - ref to the textarea/input (antd or native)
 * @param {boolean} [props.singleLine] - true for a single-line `<input>` (no wrapping, horizontal scroll)
 */
export default function MentionHighlightOverlay({ text, targetRef, singleLine = false }) {
  const overlayRef = useRef(null);

  useLayoutEffect(() => {
    const source = resolveInputEl(targetRef);
    const overlay = overlayRef.current;
    if (!source || !overlay) return;

    const syncStyle = () => {
      const cs = window.getComputedStyle(source);
      MIRRORED_PROPS.forEach((prop) => {
        overlay.style[prop] = cs[prop];
      });
      overlay.style.borderStyle = "solid";
      overlay.style.borderColor = "transparent";

      // If the source element is nested inside a wrapper (e.g. AntD's
      // affix-wrapper span), the overlay's inset-0 parent may be larger than
      // the source itself. Reposition the overlay to match the source's exact
      // bounding box relative to its offset parent so text aligns perfectly.
      const container = overlay.parentElement;
      if (container) {
        const sr = source.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const offsetTop = sr.top - cr.top;
        const offsetLeft = sr.left - cr.left;
        overlay.style.width = sr.width + "px";
        overlay.style.height = sr.height + "px";
        if (Math.abs(offsetTop) > 0.5 || Math.abs(offsetLeft) > 0.5) {
          overlay.style.top = offsetTop + "px";
          overlay.style.left = offsetLeft + "px";
          overlay.style.right = "auto";
          overlay.style.bottom = "auto";
        } else {
          overlay.style.top = "";
          overlay.style.left = "";
          overlay.style.right = "";
          overlay.style.bottom = "";
        }
      }
    };
    const syncScroll = () => {
      overlay.scrollTop = source.scrollTop;
      overlay.scrollLeft = source.scrollLeft;
    };

    syncStyle();
    syncScroll();

    source.addEventListener("scroll", syncScroll);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        syncStyle();
        syncScroll();
      });
      ro.observe(source);
      ro.observe(overlay.parentElement);
    }

    return () => {
      source.removeEventListener("scroll", syncScroll);
      ro?.disconnect();
    };
  });

  const parts = (text || "").split(MENTION_RE);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${
        singleLine ? "whitespace-pre" : "whitespace-pre-wrap break-words"
      }`}
    >
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="underline decoration-2 underline-offset-2 text-[#319527] dark:text-[#6bcf60]"
          >
            {part}
          </span>
        ) : (
          <span key={i} className="text-gray-900 dark:text-gray-100">
            {part}
          </span>
        )
      )}
      {/* keep trailing newline from collapsing the overlay's height */}
      {(text || "").endsWith("\n") ? " " : null}
    </div>
  );
}
