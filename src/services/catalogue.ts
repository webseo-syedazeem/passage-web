import { request } from "@/lib/api";
import type {
  Collection,
  Payload,
  RemoteEntry,
  Soundscape,
  TagEvent,
  WriteResult,
} from "@/types/catalogue";
const root = "/api/admin";
const id = encodeURIComponent;
export const authApi = {
  signIn: (email: string, password: string) =>
    request<{ session: { access_token: string } }>("/api/signin", {
      method: "POST",
      body: { email, password },
    }),
  // AU-2: revoke the session server-side on logout. The backend /api/logout
  // calls Supabase admin signOut, so the token stops working everywhere.
  signOut: () => request<{ message?: string }>("/api/logout", { method: "POST" }),
};
export const soundscapeApi = {
  list: async (status = "", signal?: AbortSignal) =>
    (
      await request<{ soundscapes: Soundscape[] }>(
        `${root}/soundscapes${status ? `?status=${id(status)}` : ""}`,
        { signal },
      )
    ).soundscapes,
  detail: async (key: string, signal?: AbortSignal) =>
    (
      await request<{ soundscape: Soundscape }>(
        `${root}/soundscapes/${id(key)}`,
        { signal },
      )
    ).soundscape,
  save: (key: string | undefined, body: Payload) =>
    request<WriteResult>(`${root}/soundscapes${key ? `/${id(key)}` : ""}`, {
      method: key ? "PUT" : "POST",
      body,
    }),
  status: (key: string, status: string) =>
    request<WriteResult>(`${root}/soundscapes/${id(key)}/status`, {
      method: "PUT",
      body: { status },
    }),
  revise: (key: string) =>
    request<WriteResult>(`${root}/soundscapes/${id(key)}/revise`, {
      method: "POST",
    }),
  remove: (key: string) =>
    request<WriteResult>(`${root}/soundscapes/${id(key)}`, {
      method: "DELETE",
    }),
  tags: async (key: string, signal?: AbortSignal) =>
    (
      await request<{ tag_events: TagEvent[] }>(
        `${root}/soundscapes/${id(key)}/tag-events`,
        { signal },
      )
    ).tag_events,
  addTag: (key: string, body: Payload) =>
    request<WriteResult>(`${root}/soundscapes/${id(key)}/tag-events`, {
      method: "POST",
      body,
    }),
};
export const collectionApi = {
  list: async (signal?: AbortSignal) =>
    (
      await request<{ collections: Collection[] }>(`${root}/collections`, {
        signal,
      })
    ).collections,
  detail: async (key: string, signal?: AbortSignal) =>
    (
      await request<{ collection: Collection }>(
        `${root}/collections/${id(key)}`,
        { signal },
      )
    ).collection,
  save: (key: string | undefined, body: Payload) =>
    request<WriteResult>(`${root}/collections${key ? `/${id(key)}` : ""}`, {
      method: key ? "PUT" : "POST",
      body,
    }),
  publish: (key: string, is_published: boolean) =>
    request<WriteResult>(`${root}/collections/${id(key)}/publish`, {
      method: "PUT",
      body: { is_published },
    }),
  add: (key: string, body: Payload) =>
    request<WriteResult>(`${root}/collections/${id(key)}/soundscapes`, {
      method: "POST",
      body,
    }),
  remove: (key: string, soundscapeId: string) =>
    request<WriteResult>(
      `${root}/collections/${id(key)}/soundscapes/${id(soundscapeId)}`,
      { method: "DELETE" },
    ),

};
export const remoteApi = {
  list: async (signal?: AbortSignal) =>
    (
      await request<{ entries: RemoteEntry[] }>(`${root}/remote-config`, {
        signal,
      })
    ).entries,
  detail: async (key: string, signal?: AbortSignal) =>
    (
      await request<{ entry: RemoteEntry }>(
        `${root}/remote-config/${id(key)}`,
        { signal },
      )
    ).entry,
  save: (key: string, value: unknown, is_verified: boolean) =>
    request<WriteResult>(`${root}/remote-config/${id(key)}`, {
      method: "PUT",
      body: { value, is_verified },
    }),
  remove: (key: string) =>
    request<WriteResult>(`${root}/remote-config/${id(key)}`, {
      method: "DELETE",
    }),
};
