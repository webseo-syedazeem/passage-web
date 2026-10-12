import {
  format,
  formatDistanceToNow,
  isValid,
  parse,
  parseISO,
} from "date-fns";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value?: string | null): Date | undefined {
  if (!value || !DATE_ONLY.test(value)) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value
    ? parsed
    : undefined;
}

export function parseApiTimestamp(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function formatDate(value?: string | Date | null): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? parseDateOnly(value)
        : undefined;
  return date && isValid(date) ? format(date, "d MMM yyyy") : "—";
}

export function formatDateTime(value?: string | Date | null): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? parseApiTimestamp(value)
        : undefined;
  return date && isValid(date) ? format(date, "d MMM yyyy, h:mm a") : "—";
}

export function formatRelativeDate(value?: string | null): string {
  const date = parseApiTimestamp(value);
  return date
    ? formatDistanceToNow(date, { addSuffix: true })
    : "Not available";
}

export function toApiDate(value?: Date): string {
  return value && isValid(value) ? format(value, "yyyy-MM-dd") : "";
}

export function toLocalDateTime(value?: string | null): string {
  const date = parseApiTimestamp(value);
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

export function toApiDateTime(dateValue: string, timeValue?: string): string {
  if (timeValue === undefined) {
    return parseApiTimestamp(dateValue)?.toISOString() ?? "";
  }
  const date = parseDateOnly(dateValue);
  if (!date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) return "";
  const [hours, minutes] = timeValue.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function splitLocalDateTime(value?: string | null) {
  const local = toLocalDateTime(value);
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function isValidDateValue(value?: string | null) {
  return !!parseDateOnly(value);
}

export function isValidTimestampValue(value?: string | null) {
  return !!parseApiTimestamp(value);
}
