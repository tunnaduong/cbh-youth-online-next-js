import { readFileSync } from "fs";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Sent to the API with each request so "logged-in devices" can show
    // which web version a browser last used.
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.chuyenbienhoa.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "cbh-youth-online-api.test",
        port: "",
        pathname: "/**",
      },
    ],
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'app'],
  },
  async rewrites() {
    return [
      {
        source: "/egg",
        destination: "/egg.html",
      },
    ];
  },
};

export default nextConfig;
