import { useState } from "react";
import { ImageOff } from "lucide-react";
import { assetUrl } from "@/lib/api";
import { coverVariantUrl } from "@/lib/image-url";
export function ImagePreview({
  url,
  title = "Image preview",
  large = false,
}: {
  url?: string | null;
  title?: string;
  large?: boolean;
}) {
  // Small row thumbnails only ever render at ~48px, so `sm` (480px wide) is plenty even at a
  // high device pixel ratio. The larger editor/upload preview renders up to a few hundred px
  // wide, so `md` (800px wide) keeps it sharp without pulling the full-size original.
  const original = assetUrl(url);
  const src = coverVariantUrl(original, large ? "md" : "sm");
  return (
    <ImageWithFallback
      key={original}
      src={src}
      fallbackSrc={original}
      title={title}
      large={large}
    />
  );
}
function ImageWithFallback({
  src,
  fallbackSrc,
  title,
  large,
}: {
  src?: string;
  fallbackSrc?: string;
  title: string;
  large: boolean;
}) {
  const [stage, setStage] = useState<"variant" | "original" | "broken">(
    src ? "variant" : fallbackSrc ? "original" : "broken",
  );
  const activeSrc = stage === "variant" ? src : stage === "original" ? fallbackSrc : undefined;
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted ${large ? "h-44 w-full" : "h-12 w-12"}`}
    >
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => {
            // The resized variant 404s (e.g. an image saved before variants existed, or not yet
            // backfilled) — fall back to the original exactly once, never loop further.
            if (stage === "variant" && fallbackSrc && fallbackSrc !== src) {
              setStage("original");
            } else {
              setStage("broken");
            }
          }}
        />
      ) : (
        <ImageOff
          aria-label={stage === "broken" ? "Image unavailable" : "No image"}
          className="h-5 w-5 text-muted-foreground"
        />
      )}
    </div>
  );
}
export function AudioPreview({
  url,
  label,
}: {
  url?: string | null;
  label: string;
}) {
  const src = assetUrl(url);
  const [error, setError] = useState(false);
  if (!src) return <p className="muted">{label}: no audio URL set.</p>;
  return (
    <div className="space-y-2">
      <p className="muted">{label}</p>
      <audio
        key={src}
        controls
        preload="none"
        src={src}
        aria-label={label}
        className="w-full"
        onError={() => setError(true)}
        onLoadedMetadata={() => setError(false)}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Audio unavailable. Check the URL and file format.
        </p>
      )}
    </div>
  );
}
