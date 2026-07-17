import { supabase } from "./supabaseClient";

export interface Catalog {
  figures: any[];
  collections: any[];
  releases: any[];
  tags: any[];
  figureTags: any[];
}

let catalogPromise: Promise<Catalog> | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (catalogPromise) {
    return catalogPromise;
  }

  catalogPromise = Promise.all([
    supabase
      .from("figures")
      .select(
        `
        *,
        pokemon(*),
        releases(
          id,
          number,
          name,
          release_date,
          cover_image,
          collections(id, name)
        )
      `
      )
      .order("visual_order", { ascending: true }),
    supabase.from("collections").select("*").order("name", { ascending: true }),
    supabase.from("releases").select("*").order("number", { ascending: true, nullsFirst: false }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
    supabase.from("figure_tags").select("figure_id, tags(id, name)")
  ]).then(
    ([figuresRes, collectionsRes, releasesRes, tagsRes, figureTagsRes]) => {
      if (figuresRes.error) throw figuresRes.error;
      if (collectionsRes.error) throw collectionsRes.error;
      if (releasesRes.error) throw releasesRes.error;
      if (tagsRes.error) throw tagsRes.error;
      if (figureTagsRes.error) throw figureTagsRes.error;

      return {
        figures: figuresRes.data ?? [],
        collections: collectionsRes.data ?? [],
        releases: releasesRes.data ?? [],
        tags: tagsRes.data ?? [],
        figureTags: figureTagsRes.data ?? []
      };
    }
  );

  return catalogPromise;
}

export function getTagsForFigure(
  figureId: string | number,
  figureTags: any[]
): any[] {
  return figureTags
    .filter((rel: any) => String(rel.figure_id) === String(figureId))
    .map((rel: any) => {
      const tag = rel.tags;
      if (Array.isArray(tag)) {
        return tag[0];
      }
      return tag;
    })
    .filter(Boolean);
}
