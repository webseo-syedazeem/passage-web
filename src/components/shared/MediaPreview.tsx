import { useState } from "react";
import { ImageOff } from "lucide-react";
import { assetUrl } from "@/lib/api";
export function ImagePreview({
  url,
  title = "Image preview",
  large = false,
}: {
  url?: string | null;
  title?: string;
  large?: boolean;
}) {
  const src = assetUrl(url);
  return <ImageWithFallback key={src} src={src} title={title} large={large} />;
}
function ImageWithFallback({
  src,
  title,
  large,
}: {
  src?: string;
  title: string;
  large: boolean;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted ${large ? "h-44 w-full" : "h-12 w-12"}`}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <ImageOff
          aria-label={broken ? "Image unavailable" : "No image"}
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
