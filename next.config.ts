import type { NextConfig } from "next";

function buildR2RemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.r2.dev",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "**.r2.cloudflarestorage.com",
      pathname: "/**",
    },
  ];

  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (r2PublicUrl) {
    try {
      const parsed = new URL(r2PublicUrl);
      const protocol = parsed.protocol === "http:" ? "http" : "https";
      patterns.push({
        protocol,
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        pathname: "/**",
      });
    } catch {
      // Ignore invalid URL during build
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: buildR2RemotePatterns(),
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
