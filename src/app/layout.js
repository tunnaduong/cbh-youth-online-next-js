import "./globals.css";
import ClientProviders from "./ClientProviders";

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
      <body className="bg-[#F8F8F8] dark:bg-neutral-800">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
