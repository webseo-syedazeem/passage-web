import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCollections } from "@/hooks/catalogue";
import { useOptimisticCollectionPublish } from "@/hooks/optimistic";
import type { Collection } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImagePreview } from "@/components/shared/MediaPreview";
import {
  Empty,
  PageHeading,
  QueryState,
  RefreshButton,
} from "@/components/shared/States";
export function CollectionList() {
  const query = useCollections();
  const [search, setSearch] = useState("");
  const rows =
    query.data?.filter((row) =>
      `${row.title} ${row.slug}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Collections"
        description="Curate ordered soundscapes for discovery."
      >
        <RefreshButton busy={query.isFetching} onClick={query.refetch} />
        <Button asChild>
          <Link to="/collections/new">
            <Plus />
            Add collection
          </Link>
        </Button>
      </PageHeading>
      <div className="panel mb-5 flex flex-wrap items-center justify-between gap-4">
        <p>
          <span className="mr-2 text-2xl font-semibold">
            {query.data?.length ?? "—"}
          </span>
          <span className="muted">collections</span>
        </p>
        <Input
          className="sm:max-w-xs"
          aria-label="Search collections"
          name="collection_catalogue_search"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          placeholder="Search title or slug…"
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
                  {[
                    "Collection",
                    "Mode",
                    "Explore group",
                    "Order",
                    "Items",
                    "Published",
                    "Actions",
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <CollectionRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>
              No collections found. Create a collection to start curating.
            </Empty>
          )}
        </div>
      )}
    </>
  );
}
function CollectionRow({ row }: { row: Collection }) {
  const publish = useOptimisticCollectionPublish(row);
  return (
    <tr>
      <td data-label="Collection">
        <div className="flex items-center gap-3">
          <ImagePreview url={row.cover_image_url} title={row.title} />
          <div>
            <Link
              to={`/collections/${row.id}`}
              className="font-medium hover:text-primary"
            >
              {row.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      </td>
      <td data-label="Mode" className="capitalize">{row.mode || "No mode"}</td>
      <td data-label="Explore group" className="capitalize">
        {row.explore_group || "Editorial fallback"}
      </td>
      <td data-label="Order">{row.sort_order ?? "—"}</td>
      <td data-label="Items">{row.item_count ?? row.soundscapes?.length ?? 0}</td>
      <td data-label="Published">
        <StatusBadge value={row.is_published ? "published" : "unpublished"} />
      </td>
      <td data-label="Actions">
        <div className="actions">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/collections/${row.id}`}>Members</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/collections/${row.id}/edit`}>Edit</Link>
          </Button>
          <Button
            size="sm"
            variant={row.is_published ? "outline" : "default"}
            disabled={publish.isPending}
            onClick={() => publish.mutate(!row.is_published)}
          >
            {publish.isPending
              ? "Working…"
              : row.is_published
                ? "Unpublish"
                : "Publish"}
          </Button>
        </div>
      </td>
    </tr>
  );
}
