/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
  webpack: (config, { dev }) => {
    config.resolve.symlinks = false;
    if (dev) {
      // Use high-speed in-memory cache to eliminate FAT32/Windows disk I/O bottlenecks and snapshot warnings
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

module.exports = nextConfig;
