export type AssetStatus = "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE" | "RETIRED";

export interface Asset {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  status: AssetStatus;
  buildingId: string | null;
  floorId: string | null;
  spaceId: string | null;
  bedId: string | null;
  purchaseDate: string | null;
  lastMaintenanceDate: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  name: string;
  category: string;
  status?: AssetStatus;
  buildingId?: string;
  floorId?: string;
  spaceId?: string;
  bedId?: string;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  photoUrl?: string;
}

export interface UpdateAssetInput {
  name?: string;
  category?: string;
  status?: AssetStatus;
  buildingId?: string | null;
  floorId?: string | null;
  spaceId?: string | null;
  bedId?: string | null;
  purchaseDate?: string | null;
  lastMaintenanceDate?: string | null;
  photoUrl?: string | null;
}
