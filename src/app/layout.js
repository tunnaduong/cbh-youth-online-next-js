import "./globals.css";
import { AuthProvider } from "../contexts";
import { HomePostProvider } from "@/contexts/HomePostContext";

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
        <AuthProvider>
          <HomePostProvider>{children}</HomePostProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
