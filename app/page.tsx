import { HighlightCarousel } from "@/components/highlight-carousel";
import { HomeMediaSection } from "@/components/home-media-section";
import { getHomepageData } from "@/lib/site-data";

export default async function HomePage() {
  const { featuredSlides, latest, ongoing, completed } = await getHomepageData();

  return (
    <div className="space-y-8">
      <HighlightCarousel items={featuredSlides} />
      <HomeMediaSection title="Latest Update" href="/search?scope=latest" items={latest} />
      <HomeMediaSection title="Ongoing" href="/search?scope=ongoing" items={ongoing} />
      <HomeMediaSection title="Completed" href="/search?scope=completed" items={completed} />
    </div>
  );
}
