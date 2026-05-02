const DEFAULT_ASSET_MODE = process.env.NK_ASSET_MODE ?? "auto";

function normalizeDomain(value?: string) {
  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, "");
}

export function shouldUseRemoteAssets() {
  if (DEFAULT_ASSET_MODE === "remote") {
    return true;
  }

  if (DEFAULT_ASSET_MODE === "local") {
    return false;
  }

  return process.env.NODE_ENV === "production" && Boolean(normalizeDomain(process.env.NK_THUMBNAIL_DOMAIN));
}

export function getThumbnailUrl(category: string, filename: string) {
  const safeFilename = filename
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  if (shouldUseRemoteAssets()) {
    const domain = normalizeDomain(process.env.NK_THUMBNAIL_DOMAIN);
    if (!domain) {
      return `/thumbnails/${category}/${safeFilename}`;
    }

    return `${domain}/${category}/${safeFilename}`;
  }

  return `/thumbnails/${category}/${safeFilename}`;
}

export function resolveAssetUrl(url?: string) {
  if (!url) {
    return "";
  }

  const match = url.match(/^\/thumbnails\/([^/]+)\/(.+)$/);
  if (!match) {
    return url;
  }

  return getThumbnailUrl(match[1], match[2]);
}
