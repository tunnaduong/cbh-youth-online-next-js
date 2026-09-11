"use client";

import React, { useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotificationContext } from "@/contexts/Support";
import { NAV_BADGE_CLASS, NAV_ICON_BUTTON_CLASS } from "@/components/include/navStyles";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const { unreadCount } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation(); // Prevent event bubbling to avoid conflicts with click-outside handler
    if (isOpen) {
      // If dropdown is open, close it
      setIsOpen(false);
    } else {
      // If dropdown is closed, open it
      setIsOpen(true);
    }
  };

  const bellButtonRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={bellButtonRef}
        type="button"
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
        aria-expanded={isOpen}
        className={NAV_ICON_BUTTON_CLASS}
      >
        <Bell className="h-[21px] w-[21px]" strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className={NAV_BADGE_CLASS}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} bellButtonRef={bellButtonRef} />
    </div>
  );
}
