// Service Worker for background updates
const CACHE_VERSION = Date.now().toString();
const CACHE_NAME = `cbh-youth-online-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `cbh-youth-online-runtime-v${CACHE_VERSION}`;

// Maximum cache size (10 MB)
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Helper function to calculate cache size
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let totalSize = 0;
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  return totalSize;
}

// Helper function to clean up old cache entries (LRU strategy)
async function cleanupCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length === 0) return;

  // Get all entries with their sizes and timestamps
  const entries = await Promise.all(
    keys.map(async (key) => {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        // Try to get last-modified header or use current time
        const lastModified = response.headers.get("last-modified")
          ? new Date(response.headers.get("last-modified")).getTime()
          : Date.now();
        return {
          key,
          size: blob.size,
          lastModified,
        };
      }
      return null;
    })
  );

  // Filter out null entries and sort by lastModified (oldest first)
  const validEntries = entries
    .filter((e) => e !== null)
    .sort((a, b) => a.lastModified - b.lastModified);

  // Calculate current size
  let currentSize = validEntries.reduce((sum, entry) => sum + entry.size, 0);

  // Remove oldest entries until we're under the limit
  for (const entry of validEntries) {
    if (currentSize <= maxSize) break;
    await cache.delete(entry.key);
    currentSize -= entry.size;
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Don't cache API calls - they're dynamic and can be large
  if (
    event.request.url.includes("/v1.0/") ||
    event.request.url.includes("/api/")
  ) {
    // Network only for API - no caching
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache specific static assets (images, fonts, small assets)
  // Don't cache large files or HTML pages
  const url = new URL(event.request.url);
  const shouldCache =
    url.pathname.match(
      /\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i
    ) ||
    (url.pathname.startsWith("/_next/static/") &&
      url.pathname.match(/\.(js|css)$/i));

  if (!shouldCache) {
    // Network only for non-cacheable resources
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache first strategy for small static assets only
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-GET requests or non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        // Only cache if response size is reasonable (< 1MB)
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 1024 * 1024) {
          // Skip caching large files (> 1MB)
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(async (cache) => {
          try {
            await cache.put(event.request, responseToCache);
            // Clean up cache if it's getting too large
            const cacheSize = await getCacheSize(RUNTIME_CACHE);
            if (cacheSize > MAX_CACHE_SIZE) {
              console.log(
                `[Service Worker] Cache size (${(
                  cacheSize /
                  1024 /
                  1024
                ).toFixed(2)} MB) exceeds limit, cleaning up...`
              );
              await cleanupCache(RUNTIME_CACHE, MAX_CACHE_SIZE);
            }
          } catch (error) {
            console.error("[Service Worker] Error caching response:", error);
          }
        });
        return response;
      });
    })
  );
});

// Message event - handle messages from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Received SKIP_WAITING, activating...");
    self.skipWaiting().then(() => {
      // Notify all clients that service worker is ready
      return self.clients.claim();
    });
  }
});

// Push event - receive push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] ===== PUSH EVENT RECEIVED =====");
  console.log("[Service Worker] Event:", event);
  console.log("[Service Worker] Event.data exists:", !!event.data);

  // Parse push data and show notification
  // event.data.json() and event.data.text() return Promises, so we need to use event.waitUntil()
  event.waitUntil(
    (async () => {
      let data = {};

      try {
        if (event.data) {
          // Try JSON parsing first (most common and recommended)
          try {
            data = await event.data.json();
            console.log("[Service Worker] ✅ Parsed JSON via .json():", data);
          } catch (jsonError) {
            console.log(
              "[Service Worker] .json() failed, trying .text():",
              jsonError
            );
            // Fallback to text() if json() fails
            try {
              const text = await event.data.text();
              console.log("[Service Worker] Raw push data text:", text);

              if (text) {
                data = JSON.parse(text);
                console.log(
                  "[Service Worker] ✅ Parsed JSON from text():",
                  data
                );
              } else {
                console.warn("[Service Worker] Push data text is empty");
                data = {
                  title: "Thông báo mới",
                  body: "Bạn có thông báo mới",
                };
              }
            } catch (parseError) {
              console.error(
                "[Service Worker] ❌ Error parsing push data:",
                parseError
              );
              // Use fallback data
              data = {
                title: "Thông báo mới",
                body: "Bạn có thông báo mới",
              };
            }
          }
        } else {
          console.warn("[Service Worker] No data in push event");
          data = {
            title: "Thông báo mới",
            body: "Bạn có thông báo mới",
          };
        }
      } catch (e) {
        console.error("[Service Worker] ❌ Failed to parse push data:", e);
        console.error("[Service Worker] Error details:", {
          message: e.message,
          stack: e.stack,
        });
        // Fallback data - ensure we always show something
        data = {
          title: "Thông báo mới",
          body: "Bạn có thông báo mới",
        };
      }

      // Ensure we have title and body
      const title = data.title || "Thông báo mới";
      const body = data.body || "Bạn có thông báo mới";

      console.log("[Service Worker] Notification data:", {
        title,
        body,
        hasData: !!data.data,
        dataType: data.data?.type,
      });

      // Determine URL based on notification type
      let url = "/";
      if (data.data?.type === "chat_message") {
        url =
          data.data?.url ||
          `/chat?conversation=${data.data?.conversation_id || ""}`;
        console.log("[Service Worker] Chat message notification, URL:", url);
      } else if (data.data?.url) {
        url = data.data.url;
        console.log("[Service Worker] Notification with URL:", url);
      }

      // Build notification options
      const options = {
        body: body,
        icon: data.icon || "/images/icon.png",
        badge: data.badge || "/images/badge.png",
        data: {
          ...(data.data || {}),
          url: url,
        },
        tag:
          data.tag ||
          `notification-${
            data.data?.notification_id || data.data?.message_id || Date.now()
          }`,
        requireInteraction: data.requireInteraction || false,
      };

      console.log("[Service Worker] Notification options:", options);

      // Always show notification - even if there's an error
      try {
        await self.registration.showNotification(title, options);
        console.log("[Service Worker] ✅ Notification shown successfully");
      } catch (error) {
        console.error("[Service Worker] ❌ Error showing notification:", error);
        console.error("[Service Worker] Error details:", {
          message: error.message,
          stack: error.stack,
          title,
          options,
        });
        // Try to show a fallback notification
        try {
          await self.registration.showNotification("Thông báo mới", {
            body: "Bạn có thông báo mới",
            icon: "/images/icon.png",
            badge: "/images/badge.png",
            tag: `fallback-${Date.now()}`,
          });
          console.log("[Service Worker] ✅ Fallback notification shown");
        } catch (fallbackError) {
          console.error(
            "[Service Worker] ❌ Failed to show fallback notification:",
            fallbackError
          );
        }
      }
    })()
  );
});

// Notification click event - navigate to URL
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
