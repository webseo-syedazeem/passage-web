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
export const apiBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
