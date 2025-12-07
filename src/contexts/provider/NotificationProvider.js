"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import NotificationContext from "../NotificationContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
  subscribeToPushNotifications as subscribeToPushNotificationsApi,
  unsubscribeFromPushNotifications as unsubscribeFromPushNotificationsApi,
} from "@/app/Api";
import {
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications as unsubscribePush,
  formatSubscriptionForServer,
} from "@/utils/pushNotifications";
import { useAuthContext } from "../Support";

const NotificationProvider = ({ children }) => {
  const { loggedIn } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const pollIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const subscriptionRequestedRef = useRef(false);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      if (!loggedIn) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getNotifications({
          page,
          per_page: 20,
        });

        if (response?.notifications) {
          if (append) {
            setNotifications((prev) => [...prev, ...response.notifications]);
          } else {
            setNotifications(response.notifications);
          }
          setHasMore(
            response.pagination?.current_page < response.pagination?.last_page
          );
          setCurrentPage(response.pagination?.current_page || page);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(err.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    },
    [loggedIn]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!loggedIn) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getUnreadNotificationCount();
      if (response?.unread_count !== undefined) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [loggedIn]);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (id) => {
      try {
        await deleteNotificationApi(id);
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
        throw err;
      }
    },
    [notifications]
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, fetchNotifications]);

  // Subscribe to push notifications
  const subscribePush = useCallback(async () => {
    if (!loggedIn || !isPushSupported() || subscriptionRequestedRef.current) {
      return;
    }

    try {
      subscriptionRequestedRef.current = true;
      const subscription = await subscribeToPushNotifications();

      if (subscription) {
        const formattedSubscription = formatSubscriptionForServer(subscription);
        await subscribeToPushNotificationsApi(formattedSubscription);
        setPushSubscribed(true);
        console.log("[NotificationProvider] Push notifications subscribed");
      }
    } catch (error) {
      console.error(
        "[NotificationProvider] Error subscribing to push notifications:",
        error
      );
      subscriptionRequestedRef.current = false;
    }
  }, [loggedIn]);

  // Unsubscribe from push notifications
  const unsubscribePushNotifications = useCallback(async () => {
    if (!loggedIn) {
      return;
    }

    try {
      await unsubscribePush();
      await unsubscribeFromPushNotificationsApi();
      setPushSubscribed(false);
      subscriptionRequestedRef.current = false;
      console.log("[NotificationProvider] Push notifications unsubscribed");
    } catch (error) {
      console.error(
        "[NotificationProvider] Error unsubscribing from push notifications:",
        error
      );
    }
  }, [loggedIn]);

  // Check push support
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPushSupported(isPushSupported());
    }
  }, []);

  // Subscribe to push notifications when user logs in
  useEffect(() => {
    if (
      loggedIn &&
      pushSupported &&
      !pushSubscribed &&
      !subscriptionRequestedRef.current
    ) {
      // Auto-subscribe after a short delay to avoid blocking initial load
      const timer = setTimeout(() => {
        subscribePush();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loggedIn, pushSupported, pushSubscribed, subscribePush]);

  // Unsubscribe when user logs out
  useEffect(() => {
    if (!loggedIn && pushSubscribed) {
      unsubscribePushNotifications();
    }
  }, [loggedIn, pushSubscribed, unsubscribePushNotifications]);

  // Poll for unread count only (not notifications list)
  useEffect(() => {
    if (!loggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Only fetch unread count on login, not notifications list
    // Notifications list will be fetched when dropdown is opened
    fetchUnreadCount();

    // Set up polling for unread count only
    if (!isPollingRef.current) {
      isPollingRef.current = true;
      pollIntervalRef.current = setInterval(() => {
        fetchUnreadCount();
        // Don't fetch notifications list in polling - only fetch when dropdown opens
      }, 30000); // Poll every 30 seconds for unread count only
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        isPollingRef.current = false;
      }
    };
  }, [loggedIn, fetchUnreadCount]); // Removed fetchNotifications from dependencies

  // Refresh notifications - memoized to prevent infinite loops
  const refresh = useCallback(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    pushSubscribed,
    pushSupported,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
    subscribePush,
    unsubscribePushNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationProvider;
