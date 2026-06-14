import type { AccommodationMode } from "@/types/enums";

export type SpaceType = "ROOM" | "UNIT";
export type SpaceStatus = "AVAILABLE" | "PARTIALLY_OCCUPIED" | "OCCUPIED" | "BLOCKED";
export type BedStatus = "AVAILABLE" | "OCCUPIED" | "BLOCKED";

export interface Building {
  id: string;
  name: string;
  code: string | null;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string | null;
}

export interface Space {
  id: string;
  floorId: string;
  spaceType: SpaceType;
  identifier: string;
  displayName: string | null;
  status: SpaceStatus;
  capacity: number;
  blocked: boolean;
}

export interface Bed {
  id: string;
  spaceId: string;
  bedLabel: string;
  status: BedStatus;
  blocked: boolean;
}

export interface OccupantSummary {
  membershipId: string;
  residentName: string;
  moveInDate: string;
}

export interface VizLayout {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface VizBedNode {
  id: string;
  bedLabel: string;
  status: BedStatus;
  blocked: boolean;
  currentOccupant: OccupantSummary | null;
}

export interface VizSpaceNode {
  id: string;
  spaceType: SpaceType;
  identifier: string;
  displayName: string | null;
  status: SpaceStatus;
  capacity: number;
  blocked: boolean;
  beds: VizBedNode[];
  currentOccupant: OccupantSummary | null;
  layout: VizLayout | null;
}

export interface VizFloorNode {
  id: string;
  floorNumber: number;
  name: string | null;
  spaces: VizSpaceNode[];
  layout: VizLayout | null;
}

export interface VizBuildingNode {
  id: string;
  name: string;
  code: string | null;
  floors: VizFloorNode[];
  layout: VizLayout | null;
}

export interface AccommodationVisualization {
  organizationId: string;
  accommodationMode: AccommodationMode;
  buildings: VizBuildingNode[];
}

export interface StaffOccupancy {
  id: string;
  membershipId: string;
  residentName: string;
  residentEmail: string;
  occupancyTarget: "BED" | "UNIT";
  bedId: string | null;
  bedLabel: string | null;
  unitSpaceId: string | null;
  unitIdentifier: string | null;
  moveInDate: string;
  moveOutDate: string | null;
  current: boolean;
}
