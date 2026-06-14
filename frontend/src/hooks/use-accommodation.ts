"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accommodationApi,
  bedsApi,
  buildingsApi,
  floorsApi,
  occupanciesApi,
  spacesApi,
} from "@/lib/api/accommodation";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";
import { queryDefaults } from "@/lib/query/defaults";

export function useAccommodationVisualization(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.visualization(orgId) : ["visualization", "disabled"],
    queryFn: () => accommodationApi.visualization(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useBuildings(orgId: string | undefined) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId ? queryKeys.buildings(orgId) : ["buildings", "disabled"],
    queryFn: () => buildingsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useOccupancies(orgId: string | undefined, membershipId?: string) {
  const { authReady } = useAuthReady();

  return useQuery({
    queryKey: orgId
      ? [...queryKeys.occupancies.all(orgId), membershipId ?? "all"]
      : ["occupancies", "disabled"],
    queryFn: () => occupanciesApi.list(orgId!, membershipId),
    enabled: authReady && Boolean(orgId),
    staleTime: queryDefaults.staleTime.liveOps,
  });
}

export function useAccommodationMutations(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateViz = () => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.visualization(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.buildings(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.occupancies.all(orgId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.liveOps(orgId) });
  };

  const createBuilding = useMutation({
    mutationFn: (body: { name: string; code?: string }) => buildingsApi.create(orgId!, body),
    onSettled: invalidateViz,
  });

  const createFloor = useMutation({
    mutationFn: ({
      buildingId,
      body,
    }: {
      buildingId: string;
      body: { floorNumber: number; name?: string };
    }) => floorsApi.create(orgId!, buildingId, body),
    onSettled: invalidateViz,
  });

  const createSpace = useMutation({
    mutationFn: ({
      floorId,
      body,
    }: {
      floorId: string;
      body: { identifier: string; displayName?: string };
    }) => spacesApi.create(orgId!, floorId, body),
    onSettled: invalidateViz,
  });

  const createBed = useMutation({
    mutationFn: ({ spaceId, bedLabel }: { spaceId: string; bedLabel: string }) =>
      bedsApi.create(orgId!, spaceId, { bedLabel }),
    onSettled: invalidateViz,
  });

  const allocate = useMutation({
    mutationFn: (body: {
      membershipId: string;
      bedId?: string;
      unitSpaceId?: string;
      moveInDate: string;
      monthlyRent?: number;
    }) => occupanciesApi.allocate(orgId!, body),
    onSettled: invalidateViz,
  });

  const transfer = useMutation({
    mutationFn: (body: {
      membershipId: string;
      targetBedId?: string;
      targetUnitSpaceId?: string;
      transferDate: string;
    }) => occupanciesApi.transfer(orgId!, body),
    onSettled: invalidateViz,
  });

  const release = useMutation({
    mutationFn: ({ occupancyId, moveOutDate }: { occupancyId: string; moveOutDate: string }) =>
      occupanciesApi.release(orgId!, occupancyId, moveOutDate),
    onSettled: invalidateViz,
  });

  const updateLayout = useMutation({
    mutationFn: (body: {
      buildings?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      floors?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      spaces?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
    }) => accommodationApi.updateLayout(orgId!, body),
    onSettled: invalidateViz,
  });

  const updateBuilding = useMutation({
    mutationFn: ({
      buildingId,
      body,
    }: {
      buildingId: string;
      body: { name?: string; code?: string };
    }) => buildingsApi.update(orgId!, buildingId, body),
    onSettled: invalidateViz,
  });

  const deleteBuilding = useMutation({
    mutationFn: (buildingId: string) => buildingsApi.delete(orgId!, buildingId),
    onSettled: invalidateViz,
  });

  const updateFloor = useMutation({
    mutationFn: ({
      floorId,
      body,
    }: {
      floorId: string;
      body: { floorNumber?: number; name?: string };
    }) => floorsApi.update(orgId!, floorId, body),
    onSettled: invalidateViz,
  });

  const deleteFloor = useMutation({
    mutationFn: (floorId: string) => floorsApi.delete(orgId!, floorId),
    onSettled: invalidateViz,
  });

  const updateSpace = useMutation({
    mutationFn: ({
      spaceId,
      body,
    }: {
      spaceId: string;
      body: { identifier?: string; displayName?: string };
    }) => spacesApi.update(orgId!, spaceId, body),
    onSettled: invalidateViz,
  });

  const deleteSpace = useMutation({
    mutationFn: (spaceId: string) => spacesApi.delete(orgId!, spaceId),
    onSettled: invalidateViz,
  });

  const updateBed = useMutation({
    mutationFn: ({
      bedId,
      body,
    }: {
      bedId: string;
      body: { bedLabel?: string };
    }) => bedsApi.update(orgId!, bedId, body),
    onSettled: invalidateViz,
  });

  const deleteBed = useMutation({
    mutationFn: (bedId: string) => bedsApi.delete(orgId!, bedId),
    onSettled: invalidateViz,
  });

  return {
    createBuilding,
    createFloor,
    createSpace,
    createBed,
    updateBuilding,
    deleteBuilding,
    updateFloor,
    deleteFloor,
    updateSpace,
    deleteSpace,
    updateBed,
    deleteBed,
    allocate,
    transfer,
    release,
    updateLayout,
    invalidateViz,
  };
}
