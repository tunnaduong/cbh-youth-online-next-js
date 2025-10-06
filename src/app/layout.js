"use client";

import "./globals.css";
import { AuthProvider } from "../contexts";
import { HomePostProvider } from "@/contexts/HomePostContext";
import { ThemeProvider } from "@/contexts/themeContext";
import { TopUsersProvider } from "@/contexts/TopUsersContext";
import LoadingWrapper from "@/components/LoadingWrapper";
import AntdProvider from "@/components/AntdProvider";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { App } from "antd";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/images/logo.png"
          type="image/png"
          sizes="32x32"
        />
        <title>Thanh niên Chuyên Biên Hòa Online</title>
      </head>
      <body className="bg-[#F8F8F8]">
        <ThemeProvider>
          <LoadingWrapper>
            <App>
              <AntdProvider>
                <AuthProvider>
                  <TopUsersProvider>
                    <HomePostProvider>
                      <ProgressProvider
                        height="3px"
                        color="#319528"
                        options={{ showSpinner: true }}
                        shallowRouting
                      >
                        {children}
                      </ProgressProvider>
                    </HomePostProvider>
                  </TopUsersProvider>
                </AuthProvider>
              </AntdProvider>
            </App>
          </LoadingWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
