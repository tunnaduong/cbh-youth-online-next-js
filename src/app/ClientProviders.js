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

export default function ClientProviders({ children }) {
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
