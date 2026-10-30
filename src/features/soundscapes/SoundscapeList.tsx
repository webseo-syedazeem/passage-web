import { useState } from "react";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAdminMutation, useSoundscapes } from "@/hooks/catalogue";
import { useOptimisticSoundscapeStatus } from "@/hooks/optimistic";
import { soundscapeApi } from "@/services/catalogue";
import { statuses, type Soundscape } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { ImagePreview } from "@/components/shared/MediaPreview";
import {
  Empty,
  PageHeading,
  QueryState,
  RefreshButton,
  dateLabel,
} from "@/components/shared/States";
export function SoundscapeList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const query = useSoundscapes(status);
  const rows =
    query.data?.filter((row) =>
      [row.title, row.subcategory, row.catalogue_ref]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Soundscapes"
        description="Shape the catalogue, from first idea to live release."
      >
        <RefreshButton busy={query.isFetching} onClick={query.refetch} />
        <Button asChild>
          <Link to="/soundscapes/new">
            <Plus />
            Add soundscape
          </Link>
        </Button>
      </PageHeading>
      <div className="panel mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">
            {query.data?.length ?? "—"}
          </span>
          <span className="muted">
            soundscapes
            {status ? ` · ${status.replaceAll("_", " ")}` : " · all stages"}
          </span>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search soundscapes"
              name="soundscape_catalogue_search"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Search catalogue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <OptionSelect
            aria-label="Status filter"
            value={status}
            onValueChange={setStatus}
            className="sm:w-44"
            options={statuses}
            emptyLabel="All statuses"
          />
        </div>
      </div>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {!query.isPending && !query.error && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          {rows.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    "Soundscape",
                    "Mode / category",
                    "Status",
                    "Updated",
                    "Actions",
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <SoundscapeRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>
              No soundscapes match this filter. Add a soundscape or adjust your
              search.
            </Empty>
          )}
        </div>
      )}
    </>
  );
}
function SoundscapeRow({ row }: { row: Soundscape }) {
  const [statusChoice, setStatusChoice] = useState<Soundscape["status"] | null>(null);
  const status = statusChoice ?? row.status;
  const update = useOptimisticSoundscapeStatus(row);
  const revise = useAdminMutation(
    () => soundscapeApi.revise(row.id),
    "Idea-stage revision created",
  );
  const remove = useAdminMutation(
    () => soundscapeApi.remove(row.id),
    "Idea-stage soundscape deleted",
  );
  return (
    <tr>
      <td data-label="Soundscape">
        <div className="flex items-center gap-3">
          <ImagePreview url={row.artwork_url} title={row.title} />
          <div>
            <Link
              className="font-medium hover:text-primary"
              to={`/soundscapes/${row.id}`}
            >
              {row.title || "Untitled"}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.catalogue_ref || "No catalogue reference"}
            </p>
          </div>
        </div>
      </td>
      <td data-label="Mode / category">
        <span className="capitalize">{row.mode}</span>
        <p className="mt-1 text-xs text-muted-foreground">{row.subcategory}</p>
      </td>
      <td data-label="Status">
        <StatusBadge value={row.status} />
      </td>
      <td data-label="Updated" className="text-xs text-muted-foreground">
        {dateLabel(row.updated_at)}
      </td>
      <td data-label="Actions">
        <div className="actions">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/soundscapes/${row.id}`}>Edit</Link>
          </Button>
          <OptionSelect
            aria-label={`New status for ${row.title}`}
            value={status}
            onValueChange={(value) => setStatusChoice(value as Soundscape["status"])}
            className="h-8 w-36"
            options={statuses}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={update.isPending || status === row.status}
            onClick={() => update.mutate(status, { onSettled: () => setStatusChoice(null) })}
          >
            {update.isPending ? "Working…" : "Update status"}
          </Button>
          <ConfirmAction
            label="Revise"
            title={`Revise ${row.title}?`}
            description="Create an idea-stage copy. The original status stays unchanged."
            destructive={false}
            action={() => revise.mutateAsync()}
          />
          <span
            title={
              row.status !== "idea"
                ? "Only idea-stage soundscapes can be deleted. Use on hold instead."
                : undefined
            }
          >
            <ConfirmAction
              label="Delete"
              title={`Delete ${row.title}?`}
              description="Permanently delete this idea-stage soundscape. Referenced soundscapes must be removed from collections first."
              disabled={row.status !== "idea"}
              action={() => remove.mutateAsync()}
            />
          </span>
        </div>
      </td>
    </tr>
  );
}
