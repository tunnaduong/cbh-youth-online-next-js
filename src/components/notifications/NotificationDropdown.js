"use client";

import React, { useEffect, useRef } from "react";
import { useNotificationContext } from "@/contexts/Support";
import NotificationItem from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "antd";

export default function NotificationDropdown({
  isOpen,
  onClose,
  bellButtonRef,
}) {
  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    loadMore,
    hasMore,
    refresh,
  } = useNotificationContext();
  const dropdownRef = useRef(null);

  // Track if dropdown was just opened to avoid infinite refresh
  const wasOpenRef = useRef(false);

  // Close dropdown when clicking outside (but not on the bell button)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on bell button - if so, let bell's onClick handle it
      if (
        bellButtonRef &&
        bellButtonRef.current &&
        bellButtonRef.current.contains(event.target)
      ) {
        return;
      }

      // Check if click is outside dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      // Only refresh when dropdown is first opened (not on every re-render)
      if (!wasOpenRef.current) {
        refresh();
        wasOpenRef.current = true;
      }
    } else {
      // Reset when dropdown is closed
      wasOpenRef.current = false;
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, refresh]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Thông báo
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-blue-500">
              ({unreadCount} mới)
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton active key={i} className="mb-4" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 mb-3">
            <img
              src="/images/sad_frog.png"
              alt="Không có thông báo nào"
              className="w-24 h-24 mx-auto mb-4"
            />
            Không có thông báo nào
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Đang tải..." : "Tải thêm"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
