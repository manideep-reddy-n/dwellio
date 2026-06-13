"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  announcementsApi,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from "@/lib/api/announcements";
import { useAnnouncements } from "@/hooks/use-announcements";
import { queryKeys } from "@/lib/query/keys";
import type { Announcement } from "@/types/api/announcement";

export { useAnnouncements };

export function useAnnouncementMutations(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.liveOps(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.resident.home(orgId) });
  };

  const create = useMutation({
    mutationFn: (input: CreateAnnouncementInput) => announcementsApi.create(orgId!, input),
    onSuccess: (created) => {
      if (!orgId) return;
      queryClient.setQueryData<Announcement[]>(queryKeys.announcements.list(orgId), (old) => [
        created,
        ...(old ?? []),
      ]);
    },
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAnnouncementInput }) =>
      announcementsApi.update(orgId!, id, input),
    onSettled: invalidate,
  });

  const publish = useMutation({
    mutationFn: (id: string) => announcementsApi.publish(orgId!, id),
    onMutate: (id) => {
      if (!orgId) return;
      queryClient.setQueryData<Announcement[]>(queryKeys.announcements.list(orgId), (old) =>
        old?.map((a) =>
          a.id === id
            ? { ...a, published: true, publishedAt: new Date().toISOString() }
            : a,
        ),
      );
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(orgId!, id),
    onMutate: (id) => {
      if (!orgId) return;
      queryClient.setQueryData<Announcement[]>(queryKeys.announcements.list(orgId), (old) =>
        old?.filter((a) => a.id !== id),
      );
    },
    onSettled: invalidate,
  });

  return { create, update, publish, remove };
}
