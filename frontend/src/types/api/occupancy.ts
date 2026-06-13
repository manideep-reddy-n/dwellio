import type { OccupancyTarget } from "@/types/enums";

export interface Occupancy {
  id: string;
  membershipId: string;
  residentName: string;
  residentEmail: string;
  occupancyTarget: OccupancyTarget;
  bedId: string | null;
  bedLabel: string | null;
  unitSpaceId: string | null;
  unitIdentifier: string | null;
  moveInDate: string;
  moveOutDate: string | null;
  current: boolean;
}
