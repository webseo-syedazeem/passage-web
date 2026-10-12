import { SearchPicker } from "@/components/shared/SearchPicker";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSoundscapes } from "@/hooks/catalogue";
import { useOptimisticCollectionMembers, useOptimisticCollectionPublish } from "@/hooks/optimistic";
import { collectionApi } from "@/services/catalogue";
import type { Collection } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { ImagePreview } from "@/components/shared/MediaPreview";
import {
  Empty,
  PageHeading,
  QueryState,
  RefreshButton,
} from "@/components/shared/States";
const schema = z.object({
  soundscape_id: z.string().min(1, "Choose a soundscape"),
  sort_order: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (Number.isSafeInteger(Number(value)) && Number(value) >= 0),
      "Use a nonnegative whole number",
    ),
});
type MemberValues = z.infer<typeof schema>;
export function CollectionDetail() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["collection", id],
    queryFn: ({ signal }) => collectionApi.detail(id!, signal),
  });
  if (query.isPending || query.error)
    return (
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
    );
  return query.data ? (
    <Members
      key={id}
      collection={query.data}
      refresh={query.refetch}
      refreshing={query.isFetching}
    />
  ) : (
    <Empty>Collection not found.</Empty>
  );
}
function Members({
  collection,
  refresh,
  refreshing,
}: {
  collection: Collection;
  refresh: () => unknown;
  refreshing: boolean;
}) {
  const sounds = useSoundscapes();
  const members = collection.soundscapes || [];
  const selectedIds = new Set(members.map((x) => x.id));
  const available =
    sounds.data?.filter((row) => !selectedIds.has(row.id)) || [];
  const form = useForm<MemberValues>({
    resolver: zodResolver(schema),
    defaultValues: { soundscape_id: "", sort_order: "" },
  });
  const membersMutation = useOptimisticCollectionMembers(collection);
  const { add, remove } = membersMutation;
  const publish = useOptimisticCollectionPublish(collection);
  return (
    <>
      <PageHeading
        title={collection.title}
        description={`${collection.slug} · ${members.length} members · ${collection.explore_group || "Editorial fallback"}`}
      >
        <RefreshButton busy={refreshing} onClick={refresh} />
        <Button variant="outline" asChild>
          <Link to={`/collections/${collection.id}/edit`}>Edit metadata</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/collections">Close detail</Link>
        </Button>
      </PageHeading>
      <div className="panel mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <ImagePreview
          url={collection.cover_image_url}
          title={collection.title}
        />
        <div className="min-w-0 flex-1">
          <StatusBadge value={collection.is_published ? "published" : "unpublished"} />
          <p className="muted mt-2">
            {collection.description || "No description"}
          </p>
        </div>
        <Button className="w-full sm:w-auto" disabled={publish.isPending} onClick={() => publish.mutate(!collection.is_published)}>
          {publish.isPending
            ? "Working…"
            : collection.is_published
              ? "Unpublish"
              : "Publish"}
        </Button>
      </div>
      <section className="panel mb-6">
        <h2 className="mb-4 text-lg font-medium">Add a soundscape</h2>
        <QueryState
          pending={sounds.isPending}
          error={sounds.error}
          retry={sounds.refetch}
        />
        {!sounds.isPending && !sounds.error && (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => {
              const soundscape = available.find((item) => item.id === values.soundscape_id);
              if (!soundscape) return;
              add.mutate({ soundscape, sortOrder: values.sort_order === "" ? undefined : Number(values.sort_order) }, { onSuccess: () => form.reset() });
            })}
          >
            <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <div className="space-y-2">
                <Label htmlFor="member-select">Soundscape</Label>
                <Controller
                  control={form.control}
                  name="soundscape_id"
                  render={({ field }) => (
                    <SearchPicker
                      id="member-select"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!form.formState.errors.soundscape_id}
                      options={available.map((row) => ({
                        value: row.id,
                        title: row.title,
                        meta: `${row.mode} · ${row.status.replaceAll("_", " ")}`,
                      }))}
                    />
                  )}
                />
                {form.formState.errors.soundscape_id && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.soundscape_id.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-order">Sort order (optional)</Label>
                <Input
                  id="member-order"
                  type="number"
                  min={0}
                  step={1}
                  {...form.register("sort_order")}
                />
                <p className="muted">
                  Leave empty to append after the last member.
                </p>
                {form.formState.errors.sort_order && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.sort_order.message}
                  </p>
                )}
              </div>
              <Button className="w-full lg:w-auto" disabled={add.isPending || !available.length}>
                {add.isPending ? "Adding…" : "Add soundscape"}
              </Button>
            </div>
            {add.error && (
              <p role="alert" className="text-sm text-destructive">
                {add.error.message}
              </p>
            )}
          </form>
        )}
      </section>
      <div className="overflow-x-auto rounded-xl border bg-card">
        {members.length ? (
          <table className="data-table">
            <thead>
              <tr>
                {["Order", "Title", "Mode", "Status", "Action"].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td data-label="Order">{member.collection_sort_order ?? index}</td>
                  <td data-label="Title">
                    <Link
                      className="font-medium hover:text-primary"
                      to={`/soundscapes/${member.id}`}
                    >
                      {member.title}
                    </Link>
                  </td>
                  <td data-label="Mode">{member.mode}</td>
                  <td data-label="Status">
                    <StatusBadge value={member.status} />
                  </td>
                  <td data-label="Action">
                    <ConfirmAction
                      label="Remove"
                      title={`Remove ${member.title}?`}
                      description="Remove this membership. The soundscape stays in the catalogue."
                      action={() => remove.mutateAsync(member.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>This collection has no soundscapes yet.</Empty>
        )}
      </div>
    </>
  );
}
