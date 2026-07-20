import { supabaseUrl } from "./supabaseClient";

const SUPABASE_COVER_BUCKET = "release-covers";

export function getCoverImageUrl(filename?: string | null): string | undefined {
  if (!filename || !supabaseUrl) return undefined;

  // Already a full URL (any external image or legacy Supabase Storage URL).
  if (filename.startsWith("http")) {
    return filename;
  }

  // Legacy site-absolute paths: extract the basename and build a Supabase Storage URL.
  if (filename.startsWith("/release-covers/") || filename.startsWith("/volume-covers/")) {
    const basename = filename.split("/").pop();
    return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_COVER_BUCKET}/${basename}`;
  }

  // Plain filename: build Supabase Storage public URL.
  return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_COVER_BUCKET}/${filename}`;
}
