interface CollectionLike {
  id: number | string;
  name?: string;
}

interface ReleaseLike {
  collection_id: number | string;
  release_date?: string | null;
}

function earliestReleaseDate(releases: ReleaseLike[], collectionId: number | string): string | null {
  const dates = releases
    .filter((r) => r.collection_id === collectionId && r.release_date)
    .map((r) => r.release_date as string)
    .sort();
  return dates[0] ?? null;
}

/**
 * Sort collections chronologically for public navigation and listing pages.
 *
 * Order:
 * 1. earliest release_date ascending (collections without any release date go to the end)
 * 2. name ascending, as a stable tie-breaker
 */
export function sortCollections<T extends CollectionLike>(
  collections: T[],
  releases: ReleaseLike[]
): T[] {
  return [...collections].sort((a, b) => {
    const dateA = earliestReleaseDate(releases, a.id);
    const dateB = earliestReleaseDate(releases, b.id);

    if (dateA !== dateB) {
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateA.localeCompare(dateB);
    }

    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
}

/**
 * Build a human-readable date label for a collection from its releases.
 *
 * Examples:
 * - Single release: "October 2016"
 * - Year range across releases: "2016–2017"
 */
export function formatCollectionDate(
  collectionId: number | string,
  releases: ReleaseLike[],
  monthNames: string[]
): string | null {
  const dates = releases
    .filter((r) => r.collection_id === collectionId && r.release_date)
    .map((r) => r.release_date as string)
    .sort();

  if (dates.length === 0) return null;

  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);

  const firstYear = first.getFullYear();
  const lastYear = last.getFullYear();

  if (firstYear !== lastYear) {
    return `${firstYear}–${lastYear}`;
  }

  const firstMonth = first.getMonth();
  const lastMonth = last.getMonth();

  if (firstMonth !== lastMonth) {
    return `${monthNames[firstMonth]} ${firstYear}`;
  }

  return `${monthNames[firstMonth]} ${firstYear}`;
}
