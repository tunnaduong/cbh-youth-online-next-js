"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, List } from "lucide-react";

// "Xem nhanh" quick-view table of contents, generated from h1/h2/h3
// headings in the article body (similar to Tinh Tế's article ToC).
export default function ArticleToc({ headings }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState(headings?.[0]?.id ?? null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean);

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const handleClick = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const NAVBAR_OFFSET = 90;
    const targetPosition =
      target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

    window.scrollTo({
      top: targetPosition > 0 ? targetPosition : 0,
      behavior: "smooth",
    });
    setActiveId(id);
  };

  if (!headings || headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="mb-4 rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-neutral-200"
      >
        <span className="flex items-center gap-2">
          <List size={16} />
          Xem nhanh
        </span>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {!collapsed && (
        <nav className="px-4 pb-3">
          <ul className="space-y-1.5 text-sm">
            {headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: (h.level - minLevel) * 16 }}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => handleClick(e, h.id)}
                  className={`block truncate hover:text-green-600 dark:hover:text-green-400 transition-colors ${
                    activeId === h.id
                      ? "text-green-600 dark:text-green-400 font-medium"
                      : "text-gray-600 dark:text-neutral-300"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
