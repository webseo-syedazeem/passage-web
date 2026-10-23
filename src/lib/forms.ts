import { z } from "zod";
import { arrayFields, groups, modes, tagStates } from "@/types/catalogue";
import type { Payload } from "@/types/catalogue";
import { isValidDateValue, isValidTimestampValue, toApiDateTime } from "@/lib/date";
export interface FieldSpec {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "url"
    | "date"
    | "datetime-local"
    | "password"
    | "email";
  options?: readonly string[];
  required?: boolean;
  min?: number;
  max?: number;
  hint?: string;
}
export type FormValues = Record<string, string | boolean>;
const text = (
  name: string,
  label: string,
  type: FieldSpec["type"] = "text",
): FieldSpec => ({ name, label, type });
export const soundFields: FieldSpec[] = [
  { name: "mode", label: "Mode", options: modes, required: true },
  { name: "subcategory", label: "Subcategory", required: true },
  { name: "title", label: "Title", required: true },
  text("short_title", "Short title"),
  text("catalogue_ref", "Catalogue reference"),
  text("artwork_url", "Artwork URL", "url"),
  text("one_line_description", "One-line description"),
  text("detail_description", "Detail description", "textarea"),
  { name: "colour", label: "Player colour", hint: "Hex colour, e.g. #326C82. Used by the Play button and mini player." },
  text("designed_for", "Designed for", "textarea"),
  text("best_use", "Best use", "textarea"),
  ...arrayFields
    .filter((x) => x !== "search_keywords")
    .map((name) => ({
      name,
      label: name.replaceAll("_", " "),
      hint: "Comma-separated; duplicates removed",
    })),
  text("perspective", "Perspective"),
  text("movement", "Movement"),
  {
    name: "detail_level",
    label: "Detail level",
    options: ["minimal", "gentle", "balanced", "rich"],
  },
  {
    name: "intensity",
    label: "Intensity (1–5)",
    type: "number",
    min: 1,
    max: 5,
  },
  {
    name: "duration_seconds",
    label: "Duration (seconds)",
    type: "number",
    min: 0,
  },
  {
    name: "file_size_bytes",
    label: "File size (bytes)",
    type: "number",
    min: 0,
  },
  { name: "sort_score", label: "Sort score", type: "number", min: 0 },
  text("human_presence", "Human presence", "checkbox"),
  text("is_loop", "Audio loops", "checkbox"),
  text("file_url", "Full audio URL", "url"),
  text("preview_url", "Preview clip URL", "url"),
  {
    name: "search_keywords",
    label: "Search keywords",
    hint: "Comma-separated; duplicates removed",
  },
  text("science_label", "Science label"),
  text("science_note", "Science note", "textarea"),
  text("qa_reviewer", "QA reviewer"),
  text("qa_passed_at", "QA passed at", "datetime-local"),
  text("rights_status", "Rights status"),
  text("release_date", "Release date", "date"),
];
export const collectionFields: FieldSpec[] = [
  { name: "slug", label: "Slug", required: true },
  { name: "title", label: "Title", required: true },
  {
    name: "mode",
    label: "Mode",
    options: modes,
    hint: "Leave empty for no mode",
  },
  {
    name: "explore_group",
    label: "Explore group",
    options: groups,
    hint: "Empty uses the existing editorial fallback",
  },
  text("description", "Description", "textarea"),
  text("cover_image_url", "Cover image URL", "url"),
  { name: "sort_order", label: "Sort order", type: "number", min: 0 },
];
export const remoteFields: FieldSpec[] = [
  { name: "key", label: "Key", required: true },
  { name: "value", label: "Value (JSON)", required: true, type: "textarea" },
  text("is_verified", "Verified (public)", "checkbox"),
];
export const tagFields: FieldSpec[] = [
  {
    name: "tag_group",
    label: "Tag group",
    required: true,
    options: arrayFields,
  },
  { name: "tag_value", label: "Tag value", required: true },
  { name: "state", label: "State", required: true, options: tagStates },
  text("source", "Source"),
];
const prohibited = [
  "heal",
  "repair dna",
  "repairs dna",
  "dna repair",
  "guarantee sleep",
  "guarantees sleep",
  "guarantee productivity",
  "guarantees productivity",
  "cure",
  "cures",
  "treats anxiety",
  "treat anxiety",
  "force a brain state",
  "forces a brain state",
  "brainwave entrainment guarantee",
];
export function formSchema(fields: FieldSpec[]) {
  return z
    .record(z.string(), z.union([z.string(), z.boolean()]))
    .superRefine((values, ctx) => {
      for (const field of fields) {
        const raw = values[field.name];
        const value = typeof raw === "string" ? raw.trim() : "";
        const issue = (message: string) =>
          ctx.addIssue({ code: "custom", path: [field.name], message });
        if (field.required && !value) issue(`${field.label} is required`);
        if (!value) continue;
        if (field.name === "colour" && !/^#[0-9a-f]{6}$/i.test(value))
          issue("Enter a six-digit hex colour, e.g. #326C82");
        if (field.options && !field.options.includes(value))
          issue("Choose a supported value");
        if (
          field.type === "number" &&
          (!Number.isSafeInteger(Number(value)) ||
            (field.min !== undefined && Number(value) < field.min) ||
            (field.max !== undefined && Number(value) > field.max))
        )
          issue(
            `Use a whole number${field.min !== undefined ? ` ≥ ${field.min}` : ""}${field.max !== undefined ? ` and ≤ ${field.max}` : ""}`,
          );
        if (
          field.type === "url" &&
          !/^https?:\/\//i.test(value) &&
          !/^\/(?!\/)/.test(value)
        )
          issue("Use an http(s) URL or a backend path starting with /");
        if (
          field.type === "datetime-local" &&
          !isValidTimestampValue(value)
        )
          issue("Enter a valid date and time");
        if (field.type === "date" && !isValidDateValue(value))
          issue("Enter a valid calendar date");
        if (field.name === "value") {
          try {
            JSON.parse(value);
          } catch {
            issue("Value must be valid JSON");
          }
        }
        if (
          field.name === "science_note" &&
          prohibited.some((phrase) => value.toLowerCase().includes(phrase))
        )
          issue(
            "Contains a prohibited claim phrase. Use evidence-supported, research-informed, experimental or experiential framing.",
          );
      }
    });
}
export function defaults(fields: FieldSpec[], record?: object): FormValues {
  const data = (record || {}) as Record<string, unknown>;
  return Object.fromEntries(
    fields.map((field) => {
      const value = data[field.name];
      if (field.type === "checkbox") return [field.name, value === true];
      if (field.name === "value")
        return [
          field.name,
          value === undefined ? "" : JSON.stringify(value, null, 2),
        ];
      if (field.type === "datetime-local" && value)
        return [field.name, isValidTimestampValue(String(value)) ? String(value) : ""];
      return [
        field.name,
        Array.isArray(value)
          ? value.join(", ")
          : value == null
            ? ""
            : String(value),
      ];
    }),
  );
}
export function serialize(
  fields: FieldSpec[],
  values: FormValues,
  edit: boolean,
): Payload {
  const payload: Payload = {};
  for (const field of fields) {
    const raw = values[field.name];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.type === "checkbox") {
      payload[field.name] = raw === true;
      continue;
    }
    if (arrayFields.includes(field.name as (typeof arrayFields)[number])) {
      payload[field.name] = [
        ...new Set(
          value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ];
      continue;
    }
    if (field.type === "datetime-local") {
      payload[field.name] = value ? toApiDateTime(value) : null;
      continue;
    }
    if (value)
      payload[field.name] = field.type === "number" ? Number(value) : value;
    else if (edit && !field.required) payload[field.name] = null;
  }
  return payload;
}
