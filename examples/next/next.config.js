const withIconPlugin = require("@achamaro/next-plugin-icon").default();

/** @type {import('next').NextConfig} */
const nextConfig = withIconPlugin({
  experimental: {
    serverActions: true,
  },
});

module.exports = nextConfig;
