import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/constants";

function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("[seo] NEXT_PUBLIC_SITE_URL is missing in production. Falling back to https://example.com.");
    return "https://example.com";
  }

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const DEFAULT_DESCRIPTION = "Watch and download hanime, anime, and related content in high quality.";
export const DEFAULT_OG_IMAGE = "/og-default.svg";

export function getMetadataBase() {
  return new URL(SITE_URL);
}

export function truncateDescription(value?: string, maxLength = 150) {
  const normalized = value?.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return DEFAULT_DESCRIPTION;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function resolveSeoImage(image?: string) {
  if (!image) {
    return DEFAULT_OG_IMAGE;
  }

  return image;
}

export function toAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, SITE_URL).toString();
}

export function createDefaultMetadata(): Metadata {
  return {
    metadataBase: getMetadataBase(),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  videoUrl,
  robots,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "video.other";
  videoUrl?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const finalTitle = title || SITE_NAME;
  const finalDescription = truncateDescription(description);
  const finalImage = resolveSeoImage(image);
  const absoluteUrl = toAbsoluteUrl(path);

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title: finalTitle,
    description: finalDescription,
    url: absoluteUrl,
    siteName: SITE_NAME,
    type,
    images: [
      {
        url: finalImage,
        width: 1200,
        height: 630,
      },
    ],
  };

  if (type === "video.other" && videoUrl) {
    openGraph.videos = [
      {
        url: videoUrl,
      },
    ];
  }

  return {
    title: finalTitle,
    description: finalDescription,
    robots,
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [finalImage],
    },
  };
}
