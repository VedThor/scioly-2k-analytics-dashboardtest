import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { loadSupabaseAnalyticsDataset } from "@/lib/supabase-data";

export const analyticsCacheTag = "scioly-analytics-dataset";

export const loadCachedAnalyticsDataset = unstable_cache(
  loadSupabaseAnalyticsDataset,
  [analyticsCacheTag],
  {
    revalidate: 60,
    tags: [analyticsCacheTag]
  }
);

export function invalidateAnalyticsCache() {
  revalidateTag(analyticsCacheTag);
}
