/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: "/app/books/ledger",
        destination: "/books/ledger",
      },
      {
        source: "/app/insights",
        destination: "/insights",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
