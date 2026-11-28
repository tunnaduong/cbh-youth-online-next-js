"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, X } from "lucide-react";

const DRAG_THRESHOLD_PX = 6;

/**
 * Pure helper to move an element inside an array without mutating the source.
 */
export function arrayMove(list, fromIndex, toIndex) {
  if (
    !Array.isArray(list) ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = list.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Pointer-based drag-to-reorder image grid.
 *
 * Uses Pointer Events instead of HTML5 Drag & Drop so:
 * - It works identically with mouse, trackpad, and touch screens.
 * - It never triggers parent file-dropzone dragenter/drop listeners (e.g.
 *   ComposerForm / CreatePostModal's external file drop overlay).
 * - The dragged thumbnail floats smoothly in a portal above modals.
 */
export default function SortableImageGrid({
  items = [],
  onReorder,
  onRemove,
  getKey = (item, idx) => item?.uid ?? item?.id ?? idx,
  getSrc = (item) => item?.preview || item?.url || item?.previewUrl || item?.src || item,
  getAlt = (_item, idx) => `Ảnh ${idx + 1}`,
  gridClassName = "grid grid-cols-4 gap-2",
  tileClassName = "h-24 w-full",
  imageClassName = "h-full w-full rounded-md border object-cover dark:!border-neutral-500",
  removeButtonClassName = "absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors",
  showOrderBadge = true,
  showHint = true,
  hintText = "Kéo ảnh để thay đổi thứ tự",
  trailingSlot = null,
  renderItem = null,
  className = "",
}) {
  const canDrag = items.length > 1 && typeof onReorder === "function";
  const tileRefs = useRef([]);
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);
  itemsRef.current = items;
  onReorderRef.current = onReorder;

  const dragSessionRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [dragState, setDragState] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      cleanupWindowListeners();
    };
  }, []);

  const cleanupWindowListeners = () => {
    const session = dragSessionRef.current;
    if (session?.cleanup) {
      session.cleanup();
    }
    dragSessionRef.current = null;
  };

  const findTargetIndex = (clientX, clientY, currentIndex) => {
    const count = itemsRef.current.length;
    let directHit = -1;
    let closestIdx = currentIndex;
    let closestDist = Infinity;

    for (let i = 0; i < count; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        directHit = i;
        break;
      }
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    if (directHit !== -1) return directHit;
    // Only snap to closest if reasonably near the grid (within 120px)
    return closestDist < 120 ? closestIdx : currentIndex;
  };

  const handlePointerDown = (e, index) => {
    if (!canDrag) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Never hijack clicks on buttons, links, inputs, or explicitly excluded regions
    if (e.target.closest("button, a, input, textarea, [data-no-drag='true']")) {
      return;
    }

    const tileEl = tileRefs.current[index];
    if (!tileEl) return;
    const rect = tileEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;
    const pointerId = e.pointerId;
    const src = getSrc(itemsRef.current[index]);

    const onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const session = dragSessionRef.current;
      if (!session) return;

      const dx = moveEvent.clientX - session.startX;
      const dy = moveEvent.clientY - session.startY;

      if (!session.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        session.active = true;
        suppressClickRef.current = true;
        document.body.style.userSelect = "none";
      }

      moveEvent.preventDefault();

      const nextX = moveEvent.clientX - session.offsetX;
      const nextY = moveEvent.clientY - session.offsetY;
      const targetIndex = findTargetIndex(
        moveEvent.clientX,
        moveEvent.clientY,
        session.currentIndex
      );

      if (targetIndex !== session.currentIndex && targetIndex >= 0) {
        const prevIndex = session.currentIndex;
        session.currentIndex = targetIndex;
        onReorderRef.current?.(prevIndex, targetIndex);
      }

      setDragState({
        activeIndex: session.currentIndex,
        x: nextX,
        y: nextY,
        width: session.width,
        height: session.height,
        src: session.src,
      });
    };

    const endDrag = (endEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      const wasActive = dragSessionRef.current?.active;
      cleanupWindowListeners();
      document.body.style.userSelect = "";
      setDragState(null);
      if (wasActive) {
        // Swallow the synthetic click immediately after a drop
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    dragSessionRef.current = {
      pointerId,
      startX,
      startY,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height,
      currentIndex: index,
      active: false,
      src,
      cleanup: () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
      },
    };
  };

  const handleKeyDown = (e, index) => {
    if (!canDrag) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (index > 0) {
        e.preventDefault();
        onReorder(index, index - 1);
        requestAnimationFrame(() => tileRefs.current[index - 1]?.focus());
      }
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (index < items.length - 1) {
        e.preventDefault();
        onReorder(index, index + 1);
        requestAnimationFrame(() => tileRefs.current[index + 1]?.focus());
      }
    }
  };

  const handleClickCapture = (e) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={className}>
      {showHint && canDrag && (
        <div className="mb-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
          <span>{hintText}</span>
        </div>
      )}

      <div className={gridClassName}>
        {items.map((item, index) => {
          const isBeingDragged = dragState?.activeIndex === index;
          const src = getSrc(item);
          const key = getKey(item, index);

          if (renderItem) {
            return (
              <div
                key={key}
                ref={(el) => {
                  tileRefs.current[index] = el;
                }}
                draggable={false}
                onPointerDown={(e) => handlePointerDown(e, index)}
                onClickCapture={handleClickCapture}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`${canDrag ? "cursor-grab active:cursor-grabbing select-none touch-none" : ""} transition-opacity ${
                  isBeingDragged ? "opacity-30" : "opacity-100"
                }`}
              >
                {renderItem(item, index, { isDragging: isBeingDragged, canDrag })}
              </div>
            );
          }

          return (
            <div
              key={key}
              ref={(el) => {
                tileRefs.current[index] = el;
              }}
              tabIndex={canDrag ? 0 : undefined}
              aria-label={
                canDrag
                  ? `${getAlt(item, index)} (vị trí ${index + 1}/${items.length}, kéo hoặc dùng phím mũi tên để đổi thứ tự)`
                  : getAlt(item, index)
              }
              draggable={false}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onClickCapture={handleClickCapture}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`group relative ${tileClassName} ${
                canDrag ? "cursor-grab active:cursor-grabbing select-none touch-none" : ""
              } rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isBeingDragged
                  ? "opacity-30 ring-2 ring-dashed ring-primary-500"
                  : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={getAlt(item, index)}
                draggable={false}
                className={`pointer-events-none select-none ${imageClassName}`}
              />

              {showOrderBadge && canDrag && (
                <span className="pointer-events-none absolute left-1 top-1 z-10 flex items-center gap-0.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                  <GripVertical className="h-2.5 w-2.5 opacity-80" />
                  {index + 1}
                </span>
              )}

              {onRemove && (
                <button
                  type="button"
                  data-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRemove(index, item)}
                  aria-label="Xóa ảnh"
                  className={removeButtonClassName}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {trailingSlot}
      </div>

      {mounted &&
        dragState &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: dragState.width,
              height: dragState.height,
              transform: `translate3d(${dragState.x}px, ${dragState.y}px, 0) scale(1.05)`,
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className="overflow-hidden rounded-md shadow-2xl ring-2 ring-primary-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dragState.src}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
