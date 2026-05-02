export function formatCompactNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateLabel(value?: string) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(value?: string) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTimeLabel(value?: number | string) {
  if (typeof value === "undefined") {
    return "just now";
  }

  const timestamp = typeof value === "number" ? value : new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "just now";
  }

  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, seconds] of ranges) {
    if (Math.abs(deltaSeconds) >= seconds) {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }

  return formatter.format(deltaSeconds, "second");
}

export function formatProgressLabel(progress?: number) {
  if (typeof progress !== "number" || Number.isNaN(progress)) {
    return null;
  }

  return progress >= 100 ? "Completed" : `${progress}% watched`;
}

export function formatDurationLabel(value?: string, minutes?: number) {
  if (value) {
    return value;
  }

  if (!minutes) {
    return "Unknown";
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  return `${minutes}m`;
}
