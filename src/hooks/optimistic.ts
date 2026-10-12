import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { collectionApi, soundscapeApi } from "@/services/catalogue";
import { supportApi } from "@/services/support";
import type { Collection, Soundscape, Status, WriteResult } from "@/types/catalogue";
import type { SupportPage, SupportRequest, SupportStatus } from "@/types/support";

type Snapshot<T> = [QueryKey, T | undefined][];

function restore<T>(client: ReturnType<typeof useQueryClient>, snapshots: Snapshot<T>) {
  for (const [key, value] of snapshots) client.setQueryData(key, value);
}

export function useOptimisticCollectionPublish(collection: Collection) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["collection-publish", collection.id],
    mutationFn: (published: boolean) => collectionApi.publish(collection.id, published),
    onMutate: async (published) => {
      await Promise.all([client.cancelQueries({ queryKey: ["collections"] }), client.cancelQueries({ queryKey: ["collection", collection.id] })]);
      const lists = client.getQueriesData<Collection[]>({ queryKey: ["collections"] });
      const detail = client.getQueryData<Collection>(["collection", collection.id]);
      for (const [key, rows] of lists) client.setQueryData<Collection[]>(key, rows?.map((row) => row.id === collection.id ? { ...row, is_published: published } : row));
      client.setQueryData<Collection>(["collection", collection.id], (row) => row ? { ...row, is_published: published } : row);
      return { lists, detail };
    },
    onError: (error: Error, _published, context) => {
      if (context) { restore(client, context.lists); client.setQueryData(["collection", collection.id], context.detail); }
      toast.error("Publication change failed. Previous state restored.", { description: error.message });
    },
    onSuccess: (result: WriteResult, published) => {
      const canonical = result.collection;
      if (canonical) {
        client.setQueryData<Collection>(["collection", collection.id], canonical);
        for (const [key, rows] of client.getQueriesData<Collection[]>({ queryKey: ["collections"] })) client.setQueryData(key, rows?.map((row) => row.id === collection.id ? canonical : row));
      }
      toast.success(published ? "Collection published" : "Collection unpublished");
    },
    onSettled: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["collections"] }), client.invalidateQueries({ queryKey: ["collection", collection.id] })]); },
  });
}

export function useOptimisticSoundscapeStatus(soundscape: Soundscape) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["soundscape-status", soundscape.id],
    mutationFn: (status: Status) => soundscapeApi.status(soundscape.id, status),
    onMutate: async (status) => {
      await Promise.all([client.cancelQueries({ queryKey: ["soundscapes"] }), client.cancelQueries({ queryKey: ["soundscape", soundscape.id] })]);
      const lists = client.getQueriesData<Soundscape[]>({ queryKey: ["soundscapes"] });
      const detail = client.getQueryData<Soundscape>(["soundscape", soundscape.id]);
      for (const [key, rows] of lists) {
        const filter = String(key[1] || "");
        client.setQueryData<Soundscape[]>(key, rows?.flatMap((row) => row.id !== soundscape.id ? [row] : filter && filter !== status ? [] : [{ ...row, status }]));
      }
      client.setQueryData<Soundscape>(["soundscape", soundscape.id], (row) => row ? { ...row, status } : row);
      return { lists, detail };
    },
    onError: (error: Error, _status, context) => {
      if (context) { restore(client, context.lists); client.setQueryData(["soundscape", soundscape.id], context.detail); }
      toast.error("Status update failed. Previous status restored.", { description: error.message });
    },
    onSuccess: (result) => {
      const canonical = result.soundscape;
      if (canonical) client.setQueryData(["soundscape", soundscape.id], canonical);
      toast.success("Status updated");
    },
    onSettled: async () => { await client.invalidateQueries({ queryKey: ["soundscapes"] }); },
  });
}

export function useOptimisticCollectionMembers(collection: Collection) {
  const client = useQueryClient();
  const detailKey = ["collection", collection.id] as const;
  const snapshot = async () => {
    await Promise.all([
      client.cancelQueries({ queryKey: ["collections"] }),
      client.cancelQueries({ queryKey: detailKey }),
    ]);
    return {
      lists: client.getQueriesData<Collection[]>({ queryKey: ["collections"] }),
      detail: client.getQueryData<Collection>(detailKey),
    };
  };
  const restoreCollection = (context: Awaited<ReturnType<typeof snapshot>> | undefined) => {
    if (!context) return;
    restore(client, context.lists);
    client.setQueryData(detailKey, context.detail);
  };
  const updateCount = (delta: number) => {
    for (const [key, rows] of client.getQueriesData<Collection[]>({ queryKey: ["collections"] })) {
      client.setQueryData<Collection[]>(key, rows?.map((row) => row.id === collection.id
        ? { ...row, item_count: Math.max(0, (row.item_count ?? row.soundscapes?.length ?? 0) + delta) }
        : row));
    }
  };
  const settle = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["collections"] }),
      client.invalidateQueries({ queryKey: detailKey }),
    ]);
  };

  const add = useMutation({
    mutationKey: ["collection-member-add", collection.id],
    mutationFn: ({ soundscape, sortOrder }: { soundscape: Soundscape; sortOrder?: number }) =>
      collectionApi.add(collection.id, {
        soundscape_id: soundscape.id,
        ...(sortOrder === undefined ? {} : { sort_order: sortOrder }),
      }),
    onMutate: async ({ soundscape, sortOrder }) => {
      const previous = await snapshot();
      client.setQueryData<Collection>(detailKey, (current) => {
        if (!current) return current;
        const members = current.soundscapes || [];
        const nextOrder = sortOrder ?? (members.length ? Math.max(...members.map((member, index) => member.collection_sort_order ?? index)) + 1 : 0);
        return { ...current, item_count: members.length + 1, soundscapes: [...members, { ...soundscape, collection_sort_order: nextOrder }].sort((a, b) => (a.collection_sort_order ?? 0) - (b.collection_sort_order ?? 0)) };
      });
      updateCount(1);
      return previous;
    },
    onError: (error: Error, _variables, context) => {
      restoreCollection(context);
      toast.error("Could not add soundscape. Previous collection restored.", { description: error.message });
    },
    onSuccess: () => toast.success("Soundscape added to collection"),
    onSettled: settle,
  });

  const remove = useMutation({
    mutationKey: ["collection-member-remove", collection.id],
    mutationFn: (soundscapeId: string) => collectionApi.remove(collection.id, soundscapeId),
    onMutate: async (soundscapeId) => {
      const previous = await snapshot();
      client.setQueryData<Collection>(detailKey, (current) => current ? {
        ...current,
        item_count: Math.max(0, (current.item_count ?? current.soundscapes?.length ?? 0) - 1),
        soundscapes: (current.soundscapes || []).filter((member) => member.id !== soundscapeId),
      } : current);
      updateCount(-1);
      return previous;
    },
    onError: (error: Error, _soundscapeId, context) => {
      restoreCollection(context);
      toast.error("Could not remove soundscape. Previous collection restored.", { description: error.message });
    },
    onSuccess: () => toast.success("Soundscape removed from collection"),
    onSettled: settle,
  });

  return { add, remove };
}

export function useOptimisticSupportStatus(record: SupportRequest) {
  const client = useQueryClient();
  const detailKey = ["support-detail", record.id] as const;
  return useMutation({
    mutationKey: ["support-status", record.id],
    mutationFn: (status: SupportStatus) => supportApi.status(record.id, status),
    onMutate: async (status) => {
      await Promise.all([
        client.cancelQueries({ queryKey: ["support"] }),
        client.cancelQueries({ queryKey: detailKey }),
      ]);
      const pages = client.getQueriesData<SupportPage>({ queryKey: ["support"] });
      const detail = client.getQueryData<SupportRequest>(detailKey);
      client.setQueryData<SupportRequest>(detailKey, (current) => current ? { ...current, status } : current);
      for (const [key, page] of pages) {
        if (!page) continue;
        const statusFilter = new URLSearchParams(String(key[1] || "")).get("status");
        const contains = page.requests.some((item) => item.id === record.id);
        if (!contains) continue;
        const removesFromFilter = Boolean(statusFilter && statusFilter !== status);
        const requests = removesFromFilter
          ? page.requests.filter((item) => item.id !== record.id)
          : page.requests.map((item) => item.id === record.id ? { ...item, status } : item);
        const openDelta = (record.status === "open" ? -1 : 0) + (status === "open" && !removesFromFilter ? 1 : 0);
        const totalDelta = removesFromFilter ? -1 : 0;
        const total = Math.max(0, page.pagination.total + totalDelta);
        client.setQueryData<SupportPage>(key, {
          ...page,
          requests,
          pagination: { ...page.pagination, total, total_pages: Math.ceil(total / page.pagination.page_size) },
          summary: { ...page.summary, total: Math.max(0, page.summary.total + totalDelta), open: Math.max(0, page.summary.open + openDelta) },
        });
      }
      return { pages, detail };
    },
    onError: (error: Error, _status, context) => {
      if (context) {
        restore(client, context.pages);
        client.setQueryData(detailKey, context.detail);
      }
      toast.error("Could not update support status. Previous status restored.", { description: error.message });
    },
    onSuccess: (canonical) => {
      client.setQueryData(detailKey, canonical);
      toast.success("Support status updated");
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["support"] }),
        client.invalidateQueries({ queryKey: detailKey }),
      ]);
    },
  });
}
