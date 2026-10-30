export function normalizeApiBase(value: string | undefined): string {
  if (!value?.trim())
    throw new Error(
      "Set VITE_API_BASE_URL in .env.local to your backend origin, then restart Vite.",
    );
  const url = new URL(value.trim().replace(/\/+$/, ""));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "VITE_API_BASE_URL must be an HTTP(S) origin without credentials, query, or path.",
    );
  }
  return url.origin;
}
// Resolve the API origin WITHOUT throwing at module import: a thrown error here
// used to abort React before it mounted, leaving a blank white page with no
// explanation (audit PR-1). Instead capture the problem so the app can render a
// visible configuration-error screen.
let resolvedBase = "";
let resolvedError: string | null = null;
try {
  resolvedBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
} catch (error) {
  resolvedError =
    error instanceof Error ? error.message : "The API base URL is not configured correctly.";
}
export const apiBase = resolvedBase;
export const configError = resolvedError;
