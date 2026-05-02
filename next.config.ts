import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [{
  protocol: "https",
  hostname: "nekopoi.care",
}];

if (process.env.NK_THUMBNAIL_DOMAIN) {
  try {
    const url = new URL(process.env.NK_THUMBNAIL_DOMAIN);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
    });
  } catch {
    // Ignore invalid env value and keep static remote patterns.
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
