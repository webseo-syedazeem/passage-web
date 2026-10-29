/**
 * Rewrites a passage_soundscape_images_webp cover URL to point at a resized variant served by
 * the backend (see Backend local/lib/imageVariants.js + server.ts), so the admin panel requests
 * a right-sized image instead of the up-to-~1.8MB master copy for every row/preview.
 *
 * Mirrors the mobile app's `lib/image-url.ts` helper so both clients agree on
 * how variant URLs are derived from the original.
 *
 * Only touches URLs whose path contains `/passage_soundscape_images_webp/` and that are not
 * already inside a variant folder. Everything else — undefined, URLs on other hosts, or URLs
 * already rewritten to sm/md/lg — is returned completely unchanged. Never throws.
 */

export type CoverSize = "sm" | "md" | "lg";

const COVER_IMAGES_MARKER = "/passage_soundscape_images_webp/";
const VARIANT_DIR_NAMES = new Set<string>(["sm", "md", "lg"]);

export function coverVariantUrl(
  url: string | undefined,
  size: CoverSize,
): string | undefined {
  if (!url) return url;

  try {
    const markerIndex = url.indexOf(COVER_IMAGES_MARKER);
    if (markerIndex === -1) return url; // Not a passage_soundscape_images_webp URL at all.

    const afterMarker = url.slice(markerIndex + COVER_IMAGES_MARKER.length);
    const nextSlashIndex = afterMarker.indexOf("/");

    if (nextSlashIndex !== -1) {
      const firstSegment = afterMarker.slice(0, nextSlashIndex);
      if (VARIANT_DIR_NAMES.has(firstSegment)) {
        // Already `.../passage_soundscape_images_webp/sm|md|lg/<filename>` — never
        // double-rewrite (e.g. would otherwise produce `.../sm/sm/<filename>`).
        return url;
      }
      // An unexpected nested path under the images folder. Leave unchanged rather than guess.
      return url;
    }

    // `.../passage_soundscape_images_webp/<filename>` — the plain original. Insert the variant
    // folder immediately before the filename.
    const prefix = url.slice(0, markerIndex + COVER_IMAGES_MARKER.length);
    return `${prefix}${size}/${afterMarker}`;
  } catch {
    return url;
  }
}
