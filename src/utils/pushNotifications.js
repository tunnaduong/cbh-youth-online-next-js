"use client";

/**
 * Utility functions for push notifications.
 */

// Global lock to prevent duplicate subscriptions
let subscriptionLock = false;
let subscriptionPromise = null;

/**
 * Check if push notifications are supported in the browser.
 *
 * @returns {boolean}
 */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Request notification permission from the user.
 *
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  if (Notification.permission === "granted") {
    return Notification.permission;
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission has been denied");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get service worker registration.
 *
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported");
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}

/**
 * Subscribe to push notifications.
 *
 * @param {string} [vapidPublicKey] - VAPID public key (optional, will fetch from API if not provided)
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeToPushNotifications(vapidPublicKey = null) {
  console.log(
    "[pushNotifications] ===== subscribeToPushNotifications CALLED ====="
  );
  console.log(
    "[pushNotifications] Function called with vapidPublicKey:",
    vapidPublicKey ? "Provided" : "Not provided"
  );

  // If subscription is already in progress, return the existing promise
  if (subscriptionLock && subscriptionPromise) {
    console.log(
      "[pushNotifications] Subscription already in progress, reusing promise..."
    );
    return subscriptionPromise;
  }

  // Set lock and create promise
  subscriptionLock = true;
  subscriptionPromise = (async () => {
    try {
      return await performSubscription(vapidPublicKey);
    } finally {
      subscriptionLock = false;
      subscriptionPromise = null;
    }
  })();

  return subscriptionPromise;
}

/**
 * Internal function to perform the actual subscription.
 */
async function performSubscription(vapidPublicKey = null) {
  const supported = isPushSupported();
  console.log("[pushNotifications] isPushSupported():", supported);

  if (!supported) {
    console.error("[pushNotifications] Push notifications are not supported");
    throw new Error("Push notifications are not supported");
  }

  console.log(
    "[pushNotifications] Push is supported, checking notification permission..."
  );

  // Request notification permission first
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    console.error(
      "[pushNotifications] Notification permission not granted:",
      permission
    );
    throw new Error("Notification permission not granted");
  }

  console.log(
    "[pushNotifications] Notification permission granted, getting service worker registration..."
  );

  // Get service worker registration
  let registration;
  try {
    registration = await getServiceWorkerRegistration();
    console.log(
      "[pushNotifications] Service worker registration obtained:",
      registration
    );
  } catch (error) {
    console.error(
      "[pushNotifications] Error getting service worker registration:",
      error
    );
    throw error;
  }

  // Fetch VAPID public key from API if not provided
  if (!vapidPublicKey) {
    console.log(
      "[pushNotifications] VAPID key not provided, fetching from API..."
    );
    try {
      const { getVapidPublicKey } = await import("@/app/Api");
      const response = await getVapidPublicKey();
      console.log("[pushNotifications] VAPID key API response:", response);
      console.log("[pushNotifications] Response structure:", {
        hasData: !!response?.data,
        hasPublicKey: !!response?.data?.public_key,
        responseKeys: Object.keys(response || {}),
      });

      // Axios returns { data: {...}, status, ... }, so we need response.data.public_key
      vapidPublicKey = response?.data?.public_key || response?.public_key;
      console.log(
        "[pushNotifications] VAPID key extracted:",
        vapidPublicKey ? `Yes: ${vapidPublicKey.substring(0, 20)}...` : "No"
      );

      if (!vapidPublicKey) {
        console.error("[pushNotifications] VAPID key not found in response:", {
          response: response,
          data: response?.data,
          directKey: response?.public_key,
          dataKey: response?.data?.public_key,
        });
        throw new Error("VAPID public key not found in API response");
      }
    } catch (error) {
      console.error(
        "[pushNotifications] Error fetching VAPID public key:",
        error
      );
      throw new Error(`Failed to fetch VAPID public key: ${error.message}`);
    }
  } else {
    console.log("[pushNotifications] Using provided VAPID key");
  }

  // Subscribe to push notifications - VAPID key is REQUIRED
  if (!vapidPublicKey) {
    const error = new Error(
      "VAPID public key is required for push notifications"
    );
    console.error("[pushNotifications] Missing VAPID key:", error);
    throw error;
  }

  console.log("[pushNotifications] Using VAPID key for subscription");
  const subscriptionOptions = {
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  };

  // Check if there's an existing subscription first
  console.log("[pushNotifications] Checking for existing subscription...");
  try {
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log(
        "[pushNotifications] Found existing subscription:",
        existingSubscription.endpoint
      );
      
      // Verify the existing subscription is still valid
      // Check if it has the same applicationServerKey (optional, but good practice)
      // Note: We can't directly compare keys, but we can check if subscription exists
      console.log(
        "[pushNotifications] Reusing existing subscription instead of creating new one"
      );
      return existingSubscription;
    }
  } catch (error) {
    console.warn(
      "[pushNotifications] Error checking existing subscription:",
      error
    );
    // Continue to create new subscription if check fails
  }

  console.log(
    "[pushNotifications] No existing subscription found, creating new one..."
  );

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      ...subscriptionOptions,
    });

    console.log(
      "[pushNotifications] Subscription created successfully:",
      subscription.endpoint
    );
    return subscription;
  } catch (error) {
    console.error(
      "[pushNotifications] Error subscribing to push manager:",
      error
    );
    console.error("[pushNotifications] Subscription options used:", {
      userVisibleOnly: true,
      hasApplicationServerKey: !!subscriptionOptions.applicationServerKey,
    });
    throw error;
  }
}

/**
 * Unsubscribe from push notifications.
 *
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

/**
 * Get current push subscription.
 *
 * @returns {Promise<PushSubscription|null>}
 */
export async function getPushSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error("Error getting push subscription:", error);
    return null;
  }
}

/**
 * Format subscription for server (convert to JSON format).
 *
 * @param {PushSubscription} subscription
 * @returns {object}
 */
export function formatSubscriptionForServer(subscription) {
  if (!subscription) {
    return null;
  }

  const keys = subscription.getKey
    ? {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      }
    : null;

  return {
    endpoint: subscription.endpoint,
    keys: keys,
    expirationTime: subscription.expirationTime || null,
  };
}

/**
 * Convert URL-safe base64 string to Uint8Array.
 *
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string.
 *
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
