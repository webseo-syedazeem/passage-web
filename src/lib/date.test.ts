import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  isValidDateValue,
  parseDateOnly,
  splitLocalDateTime,
  toApiDate,
  toApiDateTime,
} from "./date";

describe("admin date system", () => {
  it("keeps date-only values on the same calendar date", () => {
    const parsed = parseDateOnly("2026-10-06");
    expect(toApiDate(parsed)).toBe("2026-10-06");
    expect(formatDate("2026-10-06")).toBe("6 Oct 2026");
  });

  it("formats UTC timestamps for humans and round trips the local instant", () => {
    const api = "2026-10-06T12:20:45.000Z";
    expect(formatDateTime(api)).toMatch(/^6 Oct 2026, \d{1,2}:20 [AP]M$/);
    const local = splitLocalDateTime(api);
    expect(toApiDateTime(local.date, local.time)).toBe("2026-10-06T12:20:00.000Z");
  });

  it("never exposes Invalid Date for empty or malformed values", () => {
    for (const value of [null, undefined, "", "not-a-date", "2026-02-31"]) {
      expect(formatDate(value)).toBe("—");
      expect(formatDateTime(value)).toBe("—");
    }
    expect(isValidDateValue("2026-10-06")).toBe(true);
    expect(isValidDateValue("2026-10-32")).toBe(false);
  });
});
