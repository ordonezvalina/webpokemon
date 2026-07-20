const COVERS_DIR = "/release-covers";

export function getCoverImageUrl(filename?: string | null): string | undefined {
  if (!filename) return undefined;

  // Already a site-absolute path pointing to a cover directory.
  if (filename.startsWith("/release-covers/") || filename.startsWith("/volume-covers/")) {
    return `/release-covers/${filename.split("/").pop()}`;
  }

  // Full URL: if it points to a known legacy Supabase cover bucket, rewrite it
  // to the local /release-covers/ static directory.
  if (filename.startsWith("http")) {
    const knownBucket = /\/storage\/v1\/object\/public\/(?:release-covers|volume-covers)\/([^?#]+)/;
    const match = filename.match(knownBucket);
    if (match?.[1]) {
      return `${COVERS_DIR}/${match[1]}`;
    }
    return filename;
  }

  return `${COVERS_DIR}/${filename}`;
}
