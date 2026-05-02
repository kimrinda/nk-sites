import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailPage } from "@/components/detail-page";
import { HanimeSeriesPage } from "@/components/hanime-series-page";
import { ListingPage } from "@/components/listing-page";
import { getGenreBySlug, getGenreItems, getHanimeSeriesByEpisodeSlug, getHanimeSeriesBySlug, getMediaByCategoryAndSlug } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;

  if (category === "genres") {
    const genre = await getGenreBySlug(slug);
    return buildMetadata({
      title: genre?.name,
      description: genre?.title,
      path: `/genres/${slug}`,
      type: "website",
    });
  }

  if (category === "hanime-index") {
    const series = await getHanimeSeriesBySlug(slug);
    return buildMetadata({
      title: series?.title,
      description: series?.synopsis,
      path: `/hanime-index/${slug}`,
      image: series?.coverImage || series?.thumbnail,
      type: "website",
    });
  }

  const item = await getMediaByCategoryAndSlug(category, slug);
  const series = category === "hanime" ? await getHanimeSeriesByEpisodeSlug(slug) : null;

  return buildMetadata({
    title: item?.title,
    description: item?.synopsis || series?.synopsis,
    path: `/${category}/${slug}`,
    image: item?.image || series?.coverImage || series?.thumbnail,
    type: category === "hanime" ? "video.other" : "website",
    videoUrl: category === "hanime" ? item?.servers[0]?.url : undefined,
  });
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;

  if (category === "genres") {
    const genre = await getGenreBySlug(slug);
    if (!genre) {
      notFound();
    }

    const items = await getGenreItems(slug);
    return <ListingPage title={genre.name} description={genre.title} items={items} mode="category" pageSize={12} compactMobileMeta />;
  }

  if (category === "hanime-index") {
    const series = await getHanimeSeriesBySlug(slug);
    if (!series) {
      notFound();
    }

    return <HanimeSeriesPage series={series} />;
  }

  const item = await getMediaByCategoryAndSlug(category, slug);
  if (!item) {
    notFound();
  }

  const series = category === "hanime" ? await getHanimeSeriesByEpisodeSlug(slug) : null;

  return <DetailPage item={item} series={series ? { slug: series.slug, title: series.title, href: series.href } : null} />;
}
