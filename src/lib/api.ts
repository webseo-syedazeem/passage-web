import { apiBase as base } from "./config";
let token: string | null = null;
let sessionExpired: (() => void) | undefined;
export const setToken = (value: string | null) => {
  token = value;
};
export const onSessionExpired = (callback: () => void) => {
  sessionExpired = callback;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const multipart = options.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined && !multipart)
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers,
      signal: options.signal,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
    );
  }
  const payload: { success?: boolean; error?: string; data?: T } =
    response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : {
          error: `Server returned HTTP ${response.status}. Check the API configuration.`,
        };
  if (!response.ok || payload.success === false) {
    if (response.status === 401 && token && path !== "/api/signin")
      sessionExpired?.();
    throw new ApiError(
      payload.error || `Request failed (HTTP ${response.status})`,
      response.status,
    );
  }
  if (payload.data === undefined)
    throw new ApiError("Server response is missing its data.", response.status);
  return payload.data;
}
export function assetUrl(value: string | null | undefined) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//"))
    return `${base}${value}`;
  return undefined;
}
