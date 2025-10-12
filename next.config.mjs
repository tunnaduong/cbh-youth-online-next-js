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
};

export default nextConfig;
