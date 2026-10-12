import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/date";
export function QueryState({
  pending,
  error,
  retry,
}: {
  pending: boolean;
  error: Error | null;
  retry: () => unknown;
}) {
  if (pending)
    return (
      <div role="status" aria-label="Loading" className="panel space-y-4">
        <span className="sr-only">Loading…</span>
        {[1, 2, 3, 4].map((x) => (
          <Skeleton key={x} className="h-12 w-full" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="panel space-y-4" role="alert">
        <h2 className="font-medium">Unable to load this view</h2>
        <p className="text-sm text-destructive">{error.message}</p>
        <Button variant="outline" onClick={() => retry()}>
          Try again
        </Button>
        <Link className="ml-4 text-sm text-primary underline" to="/soundscapes">
          Back to catalogue
        </Link>
      </div>
    );
  return null;
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-heading">{title}</h1>
        <p className="muted mt-2 max-w-3xl leading-6">{description}</p>
      </div>
      <div className="actions w-full shrink-0 [&>*]:max-sm:flex-1 sm:w-auto">{children}</div>
    </div>
  );
}
export function RefreshButton({
  busy,
  onClick,
}: {
  busy: boolean;
  onClick: () => unknown;
}) {
  return (
    <Button variant="outline" disabled={busy} onClick={() => onClick()}>
      <RefreshCw className={busy ? "animate-spin" : ""} />
      Refresh
    </Button>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center p-8 text-center sm:p-12">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground"><Inbox className="size-5" /></span>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
export function dateLabel(value?: string | null) {
  return formatDateTime(value);
}
