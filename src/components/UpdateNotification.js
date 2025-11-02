"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useEffect } from "react";

export default function UpdateNotification() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (updateAvailable) {
      // Auto-update service worker when update is available
      updateServiceWorker();
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [updateAvailable, updateServiceWorker]);

  return null;
}
