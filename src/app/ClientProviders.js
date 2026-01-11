"use client";

import { AuthProvider, ChatProvider, NotificationProvider } from "../contexts";
import { HomePostProvider } from "@/contexts/HomePostContext";
import { ThemeProvider } from "@/contexts/themeContext";
import { TopUsersProvider } from "@/contexts";
import { PostRefreshProvider } from "@/contexts/PostRefreshContext";
import { ForumDataProvider } from "@/contexts/provider/ForumDataProvider";
import LoadingWrapper from "@/components/LoadingWrapper";
import AntdProvider from "@/components/AntdProvider";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { App } from "antd";
import { trackOnlineUser } from "@/app/Api";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import UpdateNotification from "@/components/UpdateNotification";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

export default function ClientProviders({ children }) {
  const pathname = usePathname();

  // Register Service Worker early - this is crucial for push notifications to work
  // Service Worker must be registered before we can subscribe to push notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Service Worker registration is handled by useServiceWorker hook in UpdateNotification
      // But we ensure it's initialized early by registering here as a fallback
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[ClientProviders] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[ClientProviders] Service Worker registration failed:", error);
        });
    }
  }, []); // Only run once on mount

  // Track online user on initial load and every route change
  useEffect(() => {
    trackOnlineUser()
      .then((response) => {
        console.log("Online user tracked for route:", pathname, response);
      })
      .catch((error) => {
        console.error("Failed to track online user:", error);
      });
  }, [pathname]); // Re-run whenever pathname changes

  return (
    <ThemeProvider>
      <LoadingWrapper>
        <App>
          <AntdProvider>
            <AuthProvider>
              <ChatProvider>
              <NotificationProvider>
              <TopUsersProvider>
                <HomePostProvider>
                  <PostRefreshProvider>
                    <ForumDataProvider>
                      <ProgressProvider
                        height="3px"
                        color="#319528"
                        options={{ showSpinner: true }}
                        shallowRouting
                      >
                        {children}
                        <ChatWidget />
                        <UpdateNotification />
                      </ProgressProvider>
                    </ForumDataProvider>
                  </PostRefreshProvider>
                </HomePostProvider>
              </TopUsersProvider>
              </NotificationProvider>
              </ChatProvider>
            </AuthProvider>
          </AntdProvider>
        </App>
      </LoadingWrapper>
    </ThemeProvider>
  );
}
