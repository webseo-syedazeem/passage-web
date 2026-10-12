export const supportTypes = [
  "contact_support",
  "request_soundscape",
  "report_audio_problem",
] as const;
export const supportStatuses = [
  "open",
  "in_review",
  "resolved",
  "closed",
] as const;
export type SupportStatus = (typeof supportStatuses)[number];
export const supportLabels: Record<string, string> = {
  contact_support: "Contact support",
  request_soundscape: "Soundscape request",
  report_audio_problem: "Audio report",
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  closed: "Closed",
};
export interface SupportRequest {
  id: string;
  user_id: number | string | null;
  type: (typeof supportTypes)[number];
  subject: string | null;
  message: string;
  soundscape_id: string | null;
  contact_email: string | null;
  reason: string | null;
  status: SupportStatus;
  created_at: string;
  updated_at: string;
  user: {
    id: number | string;
    name: string | null;
    email: string | null;
  } | null;
  soundscape: { id: string; title: string } | null;
}
export interface SupportPage {
  requests: SupportRequest[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  summary: {
    total: number;
    open: number;
    contact_support: number;
    request_soundscape: number;
    report_audio_problem: number;
  };
}
