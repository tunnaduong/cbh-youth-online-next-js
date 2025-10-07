"use client";

import "./globals.css";
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
        <title>Diễn đàn học sinh Chuyên Biên Hòa</title>

        {/* Meta tag dành cho SEO */}
        <meta property="og:title" content="Diễn đàn học sinh Chuyên Biên Hòa" />
        <meta
          name="description"
          content="Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam"
        />
        <meta
          property="og:description"
          content="Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam"
        />
        <meta name="author" content="Đội ngũ CBH Youth Online" />
        <meta
          name="keywords"
          content="thpt chuyen ha nam, thanh nien chuyen bien hoa, thanh nien chuyen bien hoa online, thpt chuyen bien hoa, chuyen bien hoa, chuyen ha nam, cyo, cbh youth online, chuyen bien hoa online, chuyên biên hòa online"
        />
        <meta property="og:image" content="/images/cyo_thumbnail.png" />
      </head>
      <body className="bg-[#F8F8F8] dark:bg-neutral-800">
        <ThemeProvider>
          <LoadingWrapper>
            <App>
              <AntdProvider>
                <AuthProvider>
                  <TopUsersProvider>
                    <HomePostProvider>
                      <ForumDataProvider>
                        <PostRefreshProvider>
                          <ProgressProvider
                            height="3px"
                            color="#319528"
                            options={{ showSpinner: true }}
                            shallowRouting
                          >
                            {children}
                          </ProgressProvider>
                        </PostRefreshProvider>
                      </ForumDataProvider>
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
