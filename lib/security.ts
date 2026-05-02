function parseAllowedHosts(value?: string) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function sanitizeExternalUrl(url: string | undefined, allowedHostsValue?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const allowedHosts = parseAllowedHosts(allowedHostsValue);
    if (allowedHosts.size > 0 && !allowedHosts.has(parsed.hostname.toLowerCase())) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeStreamUrl(url: string | undefined) {
  return sanitizeExternalUrl(url, process.env.NK_ALLOWED_STREAM_HOSTS);
}

export function sanitizeDownloadUrl(url: string | undefined) {
  return sanitizeExternalUrl(url, process.env.NK_ALLOWED_DOWNLOAD_HOSTS);
}

export function sanitizeExternalPageUrl(url: string | undefined) {
  return sanitizeExternalUrl(url);
}
