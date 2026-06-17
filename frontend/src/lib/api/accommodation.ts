import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type {
  AccommodationVisualization,
  Bed,
  Building,
  Floor,
  Space,
  StaffOccupancy,
} from "@/types/api/accommodation";

export const accommodationApi = {
  visualization: (orgId: string) =>
    apiRequest<AccommodationVisualization>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/accommodation/visualization`,
    ),

  updateLayout: (
    orgId: string,
    body: {
      buildings?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      floors?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
      spaces?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
    },
  ) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/accommodation/layout`, {
      method: "PATCH",
      body,
    }),
};

export const buildingsApi = {
  list: (orgId: string) =>
    apiRequest<Building[]>(apiConfig.baseUrl, `/organizations/${orgId}/buildings`),

  create: (orgId: string, body: { name: string; code?: string }) =>
    apiRequest<Building>(apiConfig.baseUrl, `/organizations/${orgId}/buildings`, {
      method: "POST",
      body,
    }),

  update: (orgId: string, buildingId: string, body: { name?: string; code?: string }) =>
    apiRequest<Building>(apiConfig.baseUrl, `/organizations/${orgId}/buildings/${buildingId}`, {
      method: "PATCH",
      body,
    }),

  delete: (orgId: string, buildingId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/buildings/${buildingId}`, {
      method: "DELETE",
    }),
};

export const floorsApi = {
  list: (orgId: string, buildingId: string) =>
    apiRequest<Floor[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/buildings/${buildingId}/floors`,
    ),

  create: (orgId: string, buildingId: string, body: { floorNumber: number; name?: string }) =>
    apiRequest<Floor>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/buildings/${buildingId}/floors`,
      { method: "POST", body },
    ),

  update: (orgId: string, floorId: string, body: { floorNumber?: number; name?: string }) =>
    apiRequest<Floor>(apiConfig.baseUrl, `/organizations/${orgId}/floors/${floorId}`, {
      method: "PATCH",
      body,
    }),

  delete: (orgId: string, floorId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/floors/${floorId}`, {
      method: "DELETE",
    }),
};

export const spacesApi = {
  list: (orgId: string, floorId: string) =>
    apiRequest<Space[]>(apiConfig.baseUrl, `/organizations/${orgId}/floors/${floorId}/spaces`),

  create: (orgId: string, floorId: string, body: { identifier: string; displayName?: string }) =>
    apiRequest<Space>(apiConfig.baseUrl, `/organizations/${orgId}/floors/${floorId}/spaces`, {
      method: "POST",
      body,
    }),

  update: (
    orgId: string,
    spaceId: string,
    body: { identifier?: string; displayName?: string; blocked?: boolean },
  ) =>
    apiRequest<Space>(apiConfig.baseUrl, `/organizations/${orgId}/spaces/${spaceId}`, {
      method: "PATCH",
      body,
    }),

  delete: (orgId: string, spaceId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/spaces/${spaceId}`, {
      method: "DELETE",
    }),
};

export const bedsApi = {
  list: (orgId: string, spaceId: string) =>
    apiRequest<Bed[]>(apiConfig.baseUrl, `/organizations/${orgId}/spaces/${spaceId}/beds`),

  create: (orgId: string, spaceId: string, body: { bedLabel: string }) =>
    apiRequest<Bed>(apiConfig.baseUrl, `/organizations/${orgId}/spaces/${spaceId}/beds`, {
      method: "POST",
      body,
    }),

  update: (
    orgId: string,
    bedId: string,
    body: { bedLabel?: string; blocked?: boolean },
  ) =>
    apiRequest<Bed>(apiConfig.baseUrl, `/organizations/${orgId}/beds/${bedId}`, {
      method: "PATCH",
      body,
    }),

  delete: (orgId: string, bedId: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/organizations/${orgId}/beds/${bedId}`, {
      method: "DELETE",
    }),
};

export const occupanciesApi = {
  list: (orgId: string, membershipId?: string) => {
    const params = membershipId ? `?membershipId=${membershipId}` : "";
    return apiRequest<StaffOccupancy[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/occupancies${params}`,
    );
  },

  getMine: (orgId: string) =>
    apiRequest<StaffOccupancy>(apiConfig.baseUrl, `/organizations/${orgId}/occupancies/mine`),

  listHistory: (orgId: string, membershipId?: string) => {
    const params = membershipId ? `?membershipId=${membershipId}` : "";
    return apiRequest<StaffOccupancy[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/occupancies/history${params}`,
    );
  },

  listMyHistory: (orgId: string) =>
    apiRequest<StaffOccupancy[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/occupancies/history/mine`,
    ),

  allocate: (
    orgId: string,
    body: {
      membershipId: string;
      bedId?: string;
      unitSpaceId?: string;
      moveInDate: string;
      monthlyRent?: number;
      occupancyClassification?: "RESIDENT" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED";
    },
  ) =>
    apiRequest<StaffOccupancy>(apiConfig.baseUrl, `/organizations/${orgId}/occupancies/allocate`, {
      method: "POST",
      body,
    }),

  transfer: (
    orgId: string,
    body: {
      membershipId: string;
      targetBedId?: string;
      targetUnitSpaceId?: string;
      transferDate: string;
    },
  ) =>
    apiRequest<StaffOccupancy>(apiConfig.baseUrl, `/organizations/${orgId}/occupancies/transfer`, {
      method: "POST",
      body,
    }),

  release: (orgId: string, occupancyId: string, moveOutDate: string) =>
    apiRequest<StaffOccupancy>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/occupancies/${occupancyId}/release`,
      { method: "POST", body: { moveOutDate } },
    ),

  updateRent: (orgId: string, occupancyId: string, monthlyRent: number) =>
    apiRequest<StaffOccupancy>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/occupancies/${occupancyId}/rent`,
      { method: "PATCH", body: { monthlyRent } },
    ),
};
