import { supabase } from "./supabaseClient";

export interface Catalog {
  figures: any[];
  collections: any[];
  volumes: any[];
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
        volumes(
          id,
          volume,
          name_eng,
          cover_image,
          collections(id, name)
        )
      `
      )
      .order("visual_order", { ascending: true }),
    supabase.from("collections").select("*").order("name", { ascending: true }),
    supabase.from("volumes").select("*").order("volume", { ascending: true }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
    supabase.from("figure_tags").select("figure_id, tags(id, name)")
  ]).then(
    ([figuresRes, collectionsRes, volumesRes, tagsRes, figureTagsRes]) => {
      if (figuresRes.error) throw figuresRes.error;
      if (collectionsRes.error) throw collectionsRes.error;
      if (volumesRes.error) throw volumesRes.error;
      if (tagsRes.error) throw tagsRes.error;
      if (figureTagsRes.error) throw figureTagsRes.error;

      return {
        figures: figuresRes.data ?? [],
        collections: collectionsRes.data ?? [],
        volumes: volumesRes.data ?? [],
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
