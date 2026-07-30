/** @type {import('next').NextConfig} */
const nextConfig = {
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
