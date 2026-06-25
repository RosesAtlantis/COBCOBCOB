import { RankingPageClient } from "@/components/ranking/ranking-page-client";
import { parseDashboardFilters } from "@/lib/portal-filters";
import { getRankingPageData } from "@/services/ranking-service";

interface RankingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getRankingPageData(filters);

  return <RankingPageClient data={data} />;
}
