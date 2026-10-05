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
  // The site lives on www. The bare domain used to be redirected there by a
  // domain-level redirect in Vercel, which also redirected
  // /.well-known/apple-app-site-association and /.well-known/assetlinks.json.
  // iOS and Android read those two from chuyenbienhoa.com itself (the
  // passkeys' relying party) and do not follow redirects, so the mobile app
  // could not use passkeys. The redirect is done here instead, for everything
  // except /.well-known - once the bare domain is set to serve this project
  // in Vercel (no redirect), these rules take over. Query strings are kept.
  async redirects() {
    const bareDomain = [{ type: "host", value: "chuyenbienhoa.com" }];
    return [
      {
        source: "/",
        has: bareDomain,
        destination: "https://www.chuyenbienhoa.com/",
        permanent: true,
      },
      {
        // Any first path segment other than ".well-known".
        source: "/:first((?!\\.well-known(?:/|$))[^/]+)/:rest*",
        has: bareDomain,
        destination: "https://www.chuyenbienhoa.com/:first/:rest*",
        permanent: true,
      },
    ];
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
