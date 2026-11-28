"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "antd";
import { AlertTriangle } from "lucide-react";

/**
 * Guards an active post composer (create or edit) against accidental loss of
 * unsaved changes:
 *
 * 1. Browser Reload button / closing the tab / address-bar navigation:
 *    registers `beforeunload` so the browser shows its native confirmation.
 * 2. Reload keyboard shortcuts (`F5`, `Ctrl+R`, `Cmd+R`):
 *    intercepts them and opens an in-app confirmation modal ("Tải lại trang?").
 * 3. In-app link navigation (`<a href="...">`, when `interceptLinks` is true):
 *    intercepts clicks and opens an in-app confirmation modal ("Rời khỏi trang?").
 * 4. Imperative guard (`confirmAction`):
 *    used by CreatePostModal on close (`X` / Esc / mask click) to ask before
 *    discarding unsaved changes.
 */
export default function useUnsavedChangesGuard({
  enabled = false,
  isEditMode = false,
  interceptLinks = false,
  onNavigate = null,
} = {}) {
  const [pendingAction, setPendingAction] = useState(null);
  const enabledRef = useRef(enabled);
  const bypassRef = useRef(false);
  const onNavigateRef = useRef(onNavigate);

  enabledRef.current = enabled;
  onNavigateRef.current = onNavigate;

  // Whenever `enabled` transitions back to false (e.g. reset / modal closed),
  // clear any stale bypass or modal state.
  useEffect(() => {
    if (!enabled) {
      bypassRef.current = false;
      setPendingAction(null);
    }
  }, [enabled]);

  const bypassGuard = useCallback(() => {
    bypassRef.current = true;
    setPendingAction(null);
  }, []);

  const confirmAction = useCallback((kind, proceed) => {
    if (!enabledRef.current || bypassRef.current) {
      proceed?.();
      return;
    }
    setPendingAction({ kind, proceed });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e) => {
      if (!enabledRef.current || bypassRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handleKeyDown = (e) => {
      if (!enabledRef.current || bypassRef.current) return;
      const isF5 = e.key === "F5";
      const isModifierR =
        (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "r";
      if (!isF5 && !isModifierR) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingAction({
        kind: "reload",
        proceed: () => {
          bypassRef.current = true;
          window.location.reload();
        },
      });
    };

    const handleDocumentClick = (e) => {
      if (!interceptLinks || !enabledRef.current || bypassRef.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target?.closest?.("a[href]");
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
        return;
      }

      let dest;
      try {
        dest = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      const current = new URL(window.location.href);
      if (dest.href === current.href) return;

      e.preventDefault();
      e.stopPropagation();

      setPendingAction({
        kind: "navigate",
        proceed: () => {
          bypassRef.current = true;
          if (dest.origin === current.origin && typeof onNavigateRef.current === "function") {
            onNavigateRef.current(dest.pathname + dest.search + dest.hash);
          } else {
            window.location.href = dest.href;
          }
        },
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown, true);
    if (interceptLinks) {
      document.addEventListener("click", handleDocumentClick, true);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown, true);
      if (interceptLinks) {
        document.removeEventListener("click", handleDocumentClick, true);
      }
    };
  }, [enabled, interceptLinks]);

  const handleStay = useCallback(() => {
    setPendingAction(null);
  }, []);

  const handleConfirm = useCallback(() => {
    const action = pendingAction;
    bypassRef.current = true;
    setPendingAction(null);
    action?.proceed?.();
  }, [pendingAction]);

  const kind = pendingAction?.kind;
  const title =
    kind === "reload"
      ? "Tải lại trang?"
      : kind === "close"
        ? "Hủy thay đổi chưa lưu?"
        : "Rời khỏi trang?";

  const description =
    kind === "reload"
      ? isEditMode
        ? "Bạn đang chỉnh sửa bài viết và có thay đổi chưa lưu. Nếu tải lại trang, mọi thay đổi sẽ bị mất."
        : "Bạn đang tạo bài viết mới và có nội dung chưa đăng. Nếu tải lại trang, toàn bộ nội dung sẽ bị mất."
      : kind === "close"
        ? isEditMode
          ? "Bạn có thay đổi chưa lưu cho bài viết này. Nếu đóng bây giờ, các chỉnh sửa sẽ bị mất."
          : "Bạn đang soạn bài viết mới. Nếu đóng bây giờ, nội dung và tệp đính kèm sẽ bị mất."
        : isEditMode
          ? "Bạn đang có thay đổi chưa lưu cho bài viết này. Nếu rời đi, các chỉnh sửa sẽ không được lưu lại."
          : "Bạn đang tạo bài viết mới. Nếu rời khỏi trang này, nội dung bạn đang soạn sẽ bị mất.";

  const confirmLabel =
    kind === "reload"
      ? "Tải lại trang"
      : kind === "close"
        ? "Bỏ thay đổi"
        : "Rời khỏi trang";

  const confirmModal = (
    <Modal
      open={Boolean(pendingAction)}
      onCancel={handleStay}
      footer={null}
      centered
      width={420}
      zIndex={1200}
      className="custom-modal"
    >
      <div className="flex flex-col items-center text-center pt-2">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex w-full gap-2.5">
          <button
            type="button"
            onClick={handleStay}
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );

  return {
    confirmModal,
    confirmAction,
    bypassGuard,
  };
}
