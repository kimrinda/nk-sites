import type { MetadataRoute } from "next";

import { DESKTOP_NAV } from "@/lib/constants";
import { getCatalogItems } from "@/lib/site-data";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...DESKTOP_NAV.map((key) => ({
      url: `${SITE_URL}/${key === "hanime-index" ? "hanime-index" : key}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  const items = await getCatalogItems();
  const dynamicRoutes = items.map((item) => ({
    url: `${SITE_URL}${item.href}`,
    changeFrequency: "weekly" as const,
    priority: item.category === "hanime-index" ? 0.75 : 0.7,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
