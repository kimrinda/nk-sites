import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingPage } from "@/components/listing-page";
import { getCategoryPageData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

const TAB_CATEGORIES = new Set(["hanime-index", "2d-animation", "3d-hentai", "jav", "jav-cosplay", "hanime"]);

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const data = await getCategoryPageData(category);

  if (!data) {
    return buildMetadata({ path: `/${category}` });
  }

  return buildMetadata({
    title: data.title,
    description: data.description,
    path: `/${category}`,
    image: data.items[0]?.image,
    type: "website",
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = await getCategoryPageData(category);

  if (!data) {
    notFound();
  }

  const isTabCategory = TAB_CATEGORIES.has(category);
  const compactMobileMeta = isTabCategory && category !== "hanime-index";
  const useCompactTopBar = isTabCategory || category === "genres";

  return (
    <ListingPage
      title={data.title}
      description={data.description}
      items={data.items}
      genres={data.genres}
      mode={useCompactTopBar ? "category" : "default"}
      pageSize={isTabCategory ? 12 : undefined}
      compactMobileMeta={compactMobileMeta}
    />
  );
}
