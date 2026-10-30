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
const REQUEST_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 60_000;

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const multipart = options.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined && !multipart)
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  // API-1: bound every request so a hung backend can't leave buttons stuck in
  // "Saving…" indefinitely. The timeout controller is combined with the
  // caller's own abort signal so neither is lost.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, multipart ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers,
      signal: controller.signal,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch (error) {
    // A caller-initiated cancellation must still surface as an AbortError so
    // TanStack Query treats it as a cancelled query, not a failure.
    if (options.signal?.aborted) throw error;
    if (timedOut)
      throw new ApiError("The server took too long to respond. Please try again.", 0);
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCallerAbort);
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
