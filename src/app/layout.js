import "./globals.css";
import ClientProviders from "./ClientProviders";
import GlobalConsoleMessage from "../components/GlobalConsoleMessage";
import MediaLoadingWatcher from "../components/MediaLoadingWatcher";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import GlobalAds from "@/components/ads/GlobalAds";
import { EZOIC_ENABLED } from "@/lib/ezoic";

export const metadata = {
  title: {
    default: "Trường THPT Chuyên Biên Hòa – Thông Tin & Cộng Đồng Học Sinh",
    // template: "%s - Diễn đàn học sinh Chuyên Biên Hòa",
  },
  description:
    "Tìm hiểu thông tin về trường THPT Chuyên Biên Hòa, chia sẻ tài liệu học tập, kinh nghiệm ôn thi, hoạt động giáo dục và kết nối học sinh, cựu học sinh.",
  keywords:
    "thpt chuyen ha nam, thanh nien chuyen bien hoa, thanh nien chuyen bien hoa online, thpt chuyen bien hoa, chuyen bien hoa, chuyen ha nam, cyo, cbh youth online, chuyen bien hoa online, chuyên biên hòa online",
  authors: [{ name: "Đội ngũ CBH Youth Online" }],
  openGraph: {
    title: "Trường THPT Chuyên Biên Hòa – Thông Tin & Cộng Đồng Học Sinh",
    description:
      "Tìm hiểu thông tin về trường THPT Chuyên Biên Hòa, chia sẻ tài liệu học tập, kinh nghiệm ôn thi, hoạt động giáo dục và kết nối học sinh, cựu học sinh.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trường THPT Chuyên Biên Hòa – Thông Tin & Cộng Đồng Học Sinh",
    description:
      "Tìm hiểu thông tin về trường THPT Chuyên Biên Hòa, chia sẻ tài liệu học tập, kinh nghiệm ôn thi, hoạt động giáo dục và kết nối học sinh, cựu học sinh.",
    images: ["/images/cyo_thumbnail.png"],
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("theme") || "auto";
    var isDark =
      theme === "dark" ||
      (theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
      if (document.body) document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      if (document.body) document.body.classList.remove("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <meta name="google-adsense-account" content="ca-pub-3425905751761094"></meta>
        {EZOIC_ENABLED && (
          <>
            {/* Ezoic's consent scripts must load synchronously and first */}
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />
            <script async src="//www.ezojs.com/ezoic/sa.min.js" />
            <script async src="//ezoicanalytics.com/analytics.js" />
          </>
        )}
      </head>
      <body className="bg-[#F8F8F8] dark:bg-neutral-800">
        <GlobalAds />
        {/* Google Analytics (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-MYK6XE8MX3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-MYK6XE8MX3');
          `}
        </Script>
        <GlobalConsoleMessage />
        <MediaLoadingWatcher />
        <ClientProviders>{children}</ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
