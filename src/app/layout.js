import "./globals.css";
import ClientProviders from "./ClientProviders";
import GlobalConsoleMessage from "../components/GlobalConsoleMessage";
import MediaLoadingWatcher from "../components/MediaLoadingWatcher";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import EzoicRouteHandler from "@/components/ads/EzoicRouteHandler";
import { EZOIC_ENABLED } from "@/lib/ezoic";

export const metadata = {
  title: {
    default: "Diễn đàn học sinh Chuyên Biên Hòa",
    // template: "%s - Diễn đàn học sinh Chuyên Biên Hòa",
  },
  description:
    "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
  keywords:
    "thpt chuyen ha nam, thanh nien chuyen bien hoa, thanh nien chuyen bien hoa online, thpt chuyen bien hoa, chuyen bien hoa, chuyen ha nam, cyo, cbh youth online, chuyen bien hoa online, chuyên biên hòa online",
  authors: [{ name: "Đội ngũ CBH Youth Online" }],
  openGraph: {
    title: "Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
    images: ["/images/cyo_thumbnail.png"],
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
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
        {EZOIC_ENABLED && <EzoicRouteHandler />}
        {/* Google Adsense (off when Ezoic is on: other ad tags interfere with it) */}
        {!EZOIC_ENABLED && (
          <>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3425905751761094"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          id="adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9033651898132595"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
          </>
        )}
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
