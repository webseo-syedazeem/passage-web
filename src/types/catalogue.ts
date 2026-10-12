export const modes = ["sleep", "relax", "focus"] as const;
export const statuses = [
  "idea",
  "briefed",
  "generating",
  "editing",
  "audio_qa",
  "metadata_qa",
  "app_qa",
  "live",
  "on_hold",
] as const;
export const groups = [
  "nature",
  "indoor",
  "travel",
  "animals",
  "instruments",
  "weather",
  "situation",
  "editorial",
] as const;
export const arrayFields = [
  "contains",
  "does_not_contain",
  "animals",
  "instruments",
  "sound_sources",
  "search_keywords",
] as const;
export const tagStates = [
  "intended",
  "generated",
  "detected",
  "verified",
] as const;
export type Mode = (typeof modes)[number];
export type Status = (typeof statuses)[number];
export type Payload = Record<
  string,
  string | number | boolean | string[] | null
>;
export interface Soundscape {
  id: string;
  title: string;
  mode: Mode;
  subcategory: string;
  status: Status;
  updated_at?: string;
  artwork_url?: string | null;
  file_url?: string | null;
  preview_url?: string | null;
  collection_sort_order?: number;
  [field: string]: string | number | boolean | string[] | null | undefined;
}
export interface Collection {
  id: string;
  slug: string;
  title: string;
  mode: Mode | null;
  explore_group: (typeof groups)[number] | null;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number | null;
  is_published: boolean;
  item_count: number;
  soundscapes?: Soundscape[];
  updated_at?: string;
}
export interface TagEvent {
  id: string;
  tag_group: (typeof arrayFields)[number];
  tag_value: string;
  state: (typeof tagStates)[number];
  source: string | null;
  created_at: string;
}
export interface RemoteEntry {
  key: string;
  value: unknown;
  is_verified: boolean;
  updated_at: string;
}
export interface WriteResult {
  note?: string;
  soundscape?: Soundscape;
  collection?: Collection;
  entry?: RemoteEntry;
  message?: string;
}
