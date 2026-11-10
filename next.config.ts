import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Adresse Wi-Fi autorisée pour les tests mobiles locaux, sans ouvrir d'autres origines.
  allowedDevOrigins: ["192.168.1.180"],
  cacheComponents: true,
  partialPrefetching: true,
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
