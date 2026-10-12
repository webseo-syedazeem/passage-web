import { request } from "@/lib/api";
import type {
  SupportPage,
  SupportRequest,
  SupportStatus,
} from "@/types/support";
const root = "/api/admin/support";
export const supportApi = {
  list: (params: URLSearchParams, signal?: AbortSignal) =>
    request<SupportPage>(`${root}?${params}`, { signal }),
  detail: async (id: string, signal?: AbortSignal) =>
    (
      await request<{ request: SupportRequest }>(
        `${root}/${encodeURIComponent(id)}`,
        { signal },
      )
    ).request,
  status: async (id: string, status: SupportStatus) =>
    (
      await request<{ request: SupportRequest }>(
        `${root}/${encodeURIComponent(id)}/status`,
        { method: "PUT", body: { status } },
      )
    ).request,
};
