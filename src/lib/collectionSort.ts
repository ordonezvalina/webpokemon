/**
 * Sort collections chronologically for public navigation and listing pages.
 *
 * Order:
 * 1. release_year ascending (collections without a year are sent to the end)
 * 2. release_month ascending (collections without a month are sent to the end of their year bucket)
 * 3. name ascending, as a stable tie-breaker
 */
export function sortCollections<T extends { release_year?: number | null; release_month?: number | null; name?: string }>(
  collections: T[]
): T[] {
  return [...collections].sort((a, b) => {
    const yearA = a.release_year ?? null;
    const yearB = b.release_year ?? null;

    if (yearA !== yearB) {
      if (yearA === null) return 1;
      if (yearB === null) return -1;
      return yearA - yearB;
    }

    const monthA = a.release_month ?? null;
    const monthB = b.release_month ?? null;

    if (monthA !== monthB) {
      if (monthA === null) return 1;
      if (monthB === null) return -1;
      return monthA - monthB;
    }

    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
}
