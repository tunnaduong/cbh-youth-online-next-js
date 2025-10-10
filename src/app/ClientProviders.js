"use client";

import { AuthProvider } from "../contexts";
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

export default function ClientProviders({ children }) {
  const pathname = usePathname();

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
                      </ProgressProvider>
                    </ForumDataProvider>
                  </PostRefreshProvider>
                </HomePostProvider>
              </TopUsersProvider>
            </AuthProvider>
          </AntdProvider>
        </App>
      </LoadingWrapper>
    </ThemeProvider>
  );
}
