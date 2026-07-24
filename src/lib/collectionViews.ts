export type CollectionViewId = "grid" | "list" | "compact";

export interface CollectionViewItem {
  collection: any;
  slug: string;
  figureCount: number;
  releaseCount: number;
  coverImage?: string;
  dateLabel: string | null;
  lines: string[];
  lineCounts: Record<string, number>;
  firstReleaseDate?: string;
  lastReleaseDate?: string;
}

export interface ViewDefinition {
  id: CollectionViewId;
  label: string;
  icon: string;
}

export const defaultView: CollectionViewId = "grid";

export const viewRegistry: ViewDefinition[] = [
  {
    id: "grid",
    label: "Grid",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    id: "list",
    label: "List",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  },
];

export function isCollectionViewId(value: string | null | undefined): value is CollectionViewId {
  return value === "grid" || value === "list" || value === "compact";
}
