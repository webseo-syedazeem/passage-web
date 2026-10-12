import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  live: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
  published: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
  resolved: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
  verified: "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
  open: "border-amber-300/25 bg-amber-300/8 text-amber-200",
  in_review: "border-sky-300/25 bg-sky-300/8 text-sky-200",
  briefed: "border-sky-300/25 bg-sky-300/8 text-sky-200",
  generating: "border-violet-300/25 bg-violet-300/8 text-violet-200",
  editing: "border-violet-300/25 bg-violet-300/8 text-violet-200",
  idea: "border-primary/30 bg-primary/8 text-primary",
  unpublished: "border-primary/30 bg-primary/8 text-primary",
  draft: "border-primary/30 bg-primary/8 text-primary",
  closed: "border-border bg-muted/50 text-muted-foreground",
  on_hold: "border-border bg-muted/50 text-muted-foreground",
};

export function StatusBadge({ value, label, className }: { value: string; label?: string; className?: string }) {
  return <Badge variant="outline" className={cn("capitalize", tones[value] || "border-border bg-muted/40 text-foreground", className)}>
    {label || value.replaceAll("_", " ")}
  </Badge>;
}
