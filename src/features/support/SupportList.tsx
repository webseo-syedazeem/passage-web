import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supportApi } from "@/services/support";
import { supportLabels, supportTypes, supportStatuses } from "@/types/support";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { DateRangePicker } from "@/components/shared/DatePickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Empty,
  QueryState,
  PageHeading,
  RefreshButton,
  dateLabel,
} from "@/components/shared/States";

export function SupportList() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["support", params.toString()],
    queryFn: ({ signal }) => supportApi.list(params, signal),
  });
  const filter = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      return next;
    });
  return (
    <>
      <PageHeading
        title="Support & Requests"
        description="Listen, investigate and follow through on submissions from Passage listeners."
      >
        <RefreshButton busy={query.isFetching} onClick={query.refetch} />
      </PageHeading>
      <div
        className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Counts for current filters"
      >
        {(["total", "open", ...supportTypes] as const).map((key) => (
          <div key={key} className="panel">
            <p className="text-xs text-muted-foreground">
              {key === "total" ? "Matching submissions" : supportLabels[key]}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {query.data && !query.error ? query.data.summary[key] : "—"}
            </p>
          </div>
        ))}
      </div>
      <div className="panel mb-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,1.35fr)]">
          <div className="space-y-2">
            <Label htmlFor="support-type">Type</Label>
            <OptionSelect
              id="support-type"
              value={params.get("type") || ""}
              onValueChange={(value) => filter("type", value)}
              emptyLabel="All types"
              options={supportTypes.map((value) => ({
                value,
                label: supportLabels[value],
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-status">Status</Label>
            <OptionSelect
              id="support-status"
              value={params.get("status") || ""}
              onValueChange={(value) => filter("status", value)}
              emptyLabel="All statuses"
              options={supportStatuses.map((value) => ({
                value,
                label: supportLabels[value],
              }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="support-date-range">Submission date (UTC)</Label>
            <DateRangePicker
              id="support-date-range"
              from={params.get("from") || ""}
              to={params.get("to") || ""}
              onChange={(from, to) => setParams((previous) => {
                const next = new URLSearchParams(previous);
                if (from) next.set("from", from); else next.delete("from");
                if (to) next.set("to", to); else next.delete("to");
                next.delete("page");
                return next;
              })}
            />
          </div>
        </div>
        <form
          className="flex flex-wrap items-end gap-3"
          key={params.get("q") || ""}
          onSubmit={(event) => {
            event.preventDefault();
            filter(
              "q",
              String(new FormData(event.currentTarget).get("q") || "").trim(),
            );
          }}
        >
          <div className="min-w-48 flex-1 space-y-2">
            <Label htmlFor="support-search">Search submissions</Label>
            <Input
              id="support-search"
              name="q"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              maxLength={200}
              defaultValue={params.get("q") || ""}
              placeholder="Subject, message or submitted email…"
            />
          </div>
          <Button variant="outline">Search</Button>
          <Button type="button" variant="ghost" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Counts reflect all matching records, across every page.
        </p>
      </div>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {query.data && !query.error && (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            {query.data.requests.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      "Submission",
                      "Listener",
                      "Related soundscape",
                      "Status",
                      "Submitted",
                      "Action",
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.requests.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Submission">
                        <Badge variant="outline">
                          {supportLabels[row.type]}
                        </Badge>
                        <Link
                          to={`/support/${row.id}`}
                          className="mt-2 block max-w-sm truncate font-medium hover:text-primary"
                        >
                          {row.subject ||
                            row.message.slice(0, 100) ||
                            supportLabels[row.type]}
                        </Link>
                      </td>
                      <td data-label="Listener">
                        <p>
                          {row.user?.name ||
                            (row.user_id ? "Registered listener" : "Guest")}
                        </p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {row.contact_email ||
                            row.user?.email ||
                            "No email provided"}
                        </p>
                      </td>
                      <td data-label="Related soundscape">
                        {row.soundscape ? (
                          <Link
                            className="hover:text-primary"
                            to={`/soundscapes/${row.soundscape.id}`}
                          >
                            {row.soundscape.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Status">
                        <StatusBadge value={row.status} label={supportLabels[row.status]} />
                      </td>
                      <td
                        data-label="Submitted"
                        className="text-xs text-muted-foreground"
                      >
                        {dateLabel(row.created_at)}
                      </td>
                      <td data-label="Action">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/support/${row.id}`}>View request</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty>
                No submissions match these filters. New mobile submissions will
                appear here.
              </Empty>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="muted">
              {query.data.pagination.total} results · Page{" "}
              {query.data.pagination.page} of{" "}
              {Math.max(1, query.data.pagination.total_pages)}
            </p>
            <div className="actions">
              {[-1, 1].map((direction) => (
                <Button
                  key={direction}
                  variant="outline"
                  disabled={
                    query.isFetching ||
                    (direction < 0
                      ? query.data.pagination.page <= 1
                      : query.data.pagination.page >=
                        query.data.pagination.total_pages)
                  }
                  onClick={() =>
                    setParams((previous) => {
                      const next = new URLSearchParams(previous);
                      next.set(
                        "page",
                        String(query.data!.pagination.page + direction),
                      );
                      return next;
                    })
                  }
                >
                  {direction < 0 ? "Previous" : "Next"}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
