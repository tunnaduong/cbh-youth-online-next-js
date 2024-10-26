import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
