"use client";

import { createContext } from "react";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: false,
  pushSubscribed: false,
  pushSupported: false,
  fetchNotifications: () => {},
  fetchUnreadCount: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  loadMore: () => {},
  refresh: () => {},
  subscribePush: () => {},
  unsubscribePushNotifications: () => {},
});

export default NotificationContext;

