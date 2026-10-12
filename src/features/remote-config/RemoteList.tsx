import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAdminMutation, useRemoteEntries } from "@/hooks/catalogue";
import { remoteApi } from "@/services/catalogue";
import type { RemoteEntry } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import {
  Empty,
  PageHeading,
  QueryState,
  RefreshButton,
  dateLabel,
} from "@/components/shared/States";
export function RemoteList() {
  const query = useRemoteEntries();
  const [search, setSearch] = useState("");
  const rows =
    query.data?.filter((row) =>
      row.key.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Remote config"
        description="Manage verified public content and configuration."
      >
        <RefreshButton busy={query.isFetching} onClick={query.refetch} />
        <Button asChild>
          <Link to="/remote-config/new">
            <Plus />
            Add entry
          </Link>
        </Button>
      </PageHeading>
      <div className="panel mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium">{query.data?.length ?? "—"} entries</p>
          <p className="muted mt-1">
            Placeholder social proof stays hidden from the public API until
            verified.
          </p>
        </div>
        <Input
          className="sm:max-w-xs"
          aria-label="Search config keys"
          name="remote_config_search"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          placeholder="Search keys…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                  {["Key", "Verification", "Value", "Updated", "Actions"].map(
                    (x) => (
                      <th key={x}>{x}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <RemoteRow key={entry.key} entry={entry} />
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No remote config entries found.</Empty>
          )}
        </div>
      )}
    </>
  );
}
function RemoteRow({ entry }: { entry: RemoteEntry }) {
  const remove = useAdminMutation(
    () => remoteApi.remove(entry.key),
    "Remote config deleted",
  );
  const serialized = JSON.stringify(entry.value);
  return (
    <tr>
      <td data-label="Key" className="font-mono text-xs">
        <Link
          to={`/remote-config/${encodeURIComponent(entry.key)}/edit`}
          className="hover:text-primary"
        >
          {entry.key}
        </Link>
      </td>
      <td data-label="Verification">
        <StatusBadge value={entry.is_verified ? "verified" : "unpublished"} label={entry.is_verified ? "Verified" : "Placeholder"} />
      </td>
      <td data-label="Value">
        <p
          className="max-w-72 truncate font-mono text-xs text-muted-foreground"
          title={serialized}
        >
          {serialized}
        </p>
      </td>
      <td data-label="Updated" className="text-xs text-muted-foreground">
        {dateLabel(entry.updated_at)}
      </td>
      <td data-label="Actions">
        <div className="actions">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/remote-config/${encodeURIComponent(entry.key)}/edit`}>
              Edit
            </Link>
          </Button>
          <ConfirmAction
            label="Delete"
            title={`Delete ${entry.key}?`}
            description="This removes the remote config entry, including its public value if verified."
            action={() => remove.mutateAsync()}
          />
        </div>
      </td>
    </tr>
  );
}
