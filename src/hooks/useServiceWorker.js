"use client";

import { useEffect, useState } from "react";

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registrationRef = null;
    let updateInterval = null;
    let handleMessage = null;
    let handleControllerChange = null;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[Service Worker] Registered:", registration);
        setSwRegistration(registration);
        registrationRef = registration;

        // Check for updates on page load
        registration.update();

        // Check for Service Worker updates periodically (every 5 minutes)
        // NOTE: This is only for detecting app updates, NOT for chat messages
        // Chat messages are polled every 10 seconds separately
        updateInterval = setInterval(() => {
          registration.update();
        }, 300000); // 5 minutes - only checks for new app version

        // Listen for updates
        const handleUpdateFound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available (waiting to activate)
                console.log("[Service Worker] Update available - new worker installed");
                setUpdateAvailable(true);
              }
            });
          }
        };

        registration.addEventListener("updatefound", handleUpdateFound);

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          console.log("[Service Worker] Waiting worker found");
          setUpdateAvailable(true);
        }
      })
      .catch((error) => {
        console.error("[Service Worker] Registration failed:", error);
      });

    // Listen for messages from service worker
    handleMessage = (event) => {
      if (event.data && event.data.type === "UPDATE_AVAILABLE") {
        console.log("[Service Worker] Update message received:", event.data);
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Listen for controller change (new service worker activated)
    handleControllerChange = () => {
      console.log("[Service Worker] New controller activated - reloading page");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Cleanup
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (registrationRef) {
        registrationRef.removeEventListener("updatefound", () => {});
      }
      if (handleMessage) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
      if (handleControllerChange) {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      }
    };
  }, []);

  const updateServiceWorker = () => {
    if (swRegistration && swRegistration.waiting) {
      // Tell the waiting service worker to skip waiting
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      console.log("[Service Worker] Sent SKIP_WAITING message");
    }
  };

  return { updateAvailable, updateServiceWorker };
}
