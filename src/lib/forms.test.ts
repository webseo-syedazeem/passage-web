import { describe, expect, it } from "vitest";
import {
  collectionFields,
  defaults,
  formSchema,
  remoteFields,
  serialize,
  soundFields,
} from "./forms";
describe("Legacy payload contracts", () => {
  it("keeps every legacy soundscape field and adds the supported preview URL", () => {
    expect(soundFields.map((field) => field.name).sort()).toEqual(
      [
        "mode",
        "subcategory",
        "title",
        "short_title",
        "catalogue_ref",
        "artwork_url",
        "one_line_description",
        "designed_for",
        "best_use",
        "contains",
        "does_not_contain",
        "animals",
        "instruments",
        "sound_sources",
        "perspective",
        "movement",
        "detail_level",
        "intensity",
        "duration_seconds",
        "file_size_bytes",
        "sort_score",
        "human_presence",
        "is_loop",
        "file_url",
        "preview_url",
        "search_keywords",
        "science_label",
        "science_note",
        "qa_reviewer",
        "qa_passed_at",
        "rights_status",
        "release_date",
      ].sort(),
    );
  });
  it("omits empty create scalars but clears edit scalars, preserving arrays and booleans", () => {
    const values = {
      ...defaults(soundFields),
      mode: "sleep",
      subcategory: "Rain",
      title: "Storm",
      contains: " rain, rain, thunder, , ",
      is_loop: true,
    };
    const created = serialize(soundFields, values, false);
    expect(created).toMatchObject({
      contains: ["rain", "thunder"],
      human_presence: false,
      is_loop: true,
      qa_passed_at: null,
    });
    expect(created).not.toHaveProperty("short_title");
    const edited = serialize(soundFields, values, true);
    expect(edited).toMatchObject({
      short_title: null,
      sort_score: null,
      duration_seconds: null,
      release_date: null,
      animals: [],
    });
    expect(edited).not.toHaveProperty("status");
  });
  it("enforces backend integer ranges instead of legacy decimal sort scores", () => {
    const values = {
      ...defaults(soundFields),
      mode: "sleep",
      subcategory: "Rain",
      title: "Storm",
    };
    expect(
      formSchema(soundFields).safeParse({ ...values, sort_score: "1.5" })
        .success,
    ).toBe(false);
    expect(
      formSchema(soundFields).safeParse({ ...values, intensity: "6" }).success,
    ).toBe(false);
    expect(
      formSchema(soundFields).safeParse({ ...values, duration_seconds: "-1" })
        .success,
    ).toBe(false);
    expect(
      formSchema(soundFields).safeParse({
        ...values,
        sort_score: "0",
        intensity: "5",
      }).success,
    ).toBe(true);
  });
  it("matches nullable collection semantics and exact modes/groups", () => {
    const values = {
      ...defaults(collectionFields),
      slug: "rain",
      title: "Rain",
      explore_group: "nature",
      sort_order: "3",
    };
    expect(serialize(collectionFields, values, true)).toEqual({
      slug: "rain",
      title: "Rain",
      mode: null,
      explore_group: "nature",
      description: null,
      cover_image_url: null,
      sort_order: 3,
    });
    expect(
      formSchema(collectionFields).safeParse({ ...values, sort_order: "-1" })
        .success,
    ).toBe(false);
    expect(
      formSchema(collectionFields).safeParse({ ...values, mode: "relaxation" })
        .success,
    ).toBe(false);
  });
  it("round trips local QA datetime as a UTC instant", () => {
    const record = {
      qa_passed_at: "2026-10-06T10:15:00.000Z",
      release_date: "2026-10-07",
    };
    const values = defaults(soundFields, record);
    expect(serialize(soundFields, values, true).qa_passed_at).toBe(
      record.qa_passed_at,
    );
    expect(values.release_date).toBe("2026-10-07");
  });
  it("accepts every JSON value, rejects malformed JSON, and preserves null on edit", () => {
    for (const value of ["null", "false", "0", '"text"', "[]", "{}"])
      expect(
        formSchema(remoteFields).safeParse({
          key: "key",
          value,
          is_verified: false,
        }).success,
      ).toBe(true);
    expect(
      formSchema(remoteFields).safeParse({
        key: "key",
        value: "{broken}",
        is_verified: false,
      }).success,
    ).toBe(false);
    expect(defaults(remoteFields, { key: "key", value: null }).value).toBe(
      "null",
    );
  });
  it("blocks the same prohibited science-note claims as the controller", () => {
    const values = {
      ...defaults(soundFields),
      mode: "focus",
      title: "Focus",
      subcategory: "Piano",
    };
    expect(
      formSchema(soundFields).safeParse({
        ...values,
        science_note: "Guarantees productivity",
      }).success,
    ).toBe(false);
    expect(
      formSchema(soundFields).safeParse({
        ...values,
        science_note: "Experiential listening",
      }).success,
    ).toBe(true);
  });
});
