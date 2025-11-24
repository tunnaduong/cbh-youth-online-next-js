"use client";

import React, { useState, useRef } from "react";
import { useNotificationContext } from "@/contexts/Support";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const { unreadCount } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation(); // Prevent event bubbling to avoid conflicts with click-outside handler
    e.preventDefault(); // Prevent default behavior
    if (isOpen) {
      // If dropdown is open, close it
      setIsOpen(false);
    } else {
      // If dropdown is closed, open it
      setIsOpen(true);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection on rapid clicks
  };

  const bellButtonRef = useRef(null);

  return (
    <div className="relative select-none">
      <div 
        ref={bellButtonRef} 
        className="cursor-pointer relative select-none" 
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth={0}
          viewBox="0 0 512 512"
          className="text-[#6B6B6B] dark:text-neutral-300 text-[23px]"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={32}
            d="M427.68 351.43C402 320 383.87 304 383.87 217.35 383.87 138 343.35 109.73 310 96c-4.43-1.82-8.6-6-9.95-10.55C294.2 65.54 277.8 48 256 48s-38.21 17.55-44 37.47c-1.35 4.6-5.52 8.71-9.95 10.53-33.39 13.75-73.87 41.92-73.87 121.35C128.13 304 110 320 84.32 351.43 73.68 364.45 83 384 101.61 384h308.88c18.51 0 27.77-19.61 17.19-32.57zM320 384v16a64 64 0 0 1-128 0v-16"
          ></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold select-none pointer-events-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} bellButtonRef={bellButtonRef} />
    </div>
  );
}

