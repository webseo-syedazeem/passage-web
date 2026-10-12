import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { collectionApi, remoteApi, soundscapeApi } from "@/services/catalogue";
import type { WriteResult } from "@/types/catalogue";
export const useSoundscapes = (status = "") =>
  useQuery({
    queryKey: ["soundscapes", status],
    queryFn: ({ signal }) => soundscapeApi.list(status, signal),
  });
export const useCollections = () =>
  useQuery({
    queryKey: ["collections"],
    queryFn: ({ signal }) => collectionApi.list(signal),
  });
export const useRemoteEntries = () =>
  useQuery({
    queryKey: ["remote-config"],
    queryFn: ({ signal }) => remoteApi.list(signal),
  });
export function useAdminMutation<V>(
  mutationFn: (variables: V) => Promise<WriteResult>,
  message: string,
  after?: (result: WriteResult) => void,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      toast.success(message, {
        description: result.note,
        duration: result.note ? 10000 : 4000,
      });
      await Promise.all(
        [
          "soundscapes",
          "soundscape",
          "collections",
          "collection",
          "remote-config",
          "remote-entry",
          "tag-events",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      after?.(result);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
