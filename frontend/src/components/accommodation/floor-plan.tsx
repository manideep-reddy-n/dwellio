"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  bedStatusColors,
  bedStatusLabels,
  spaceStatusColors,
  spaceStatusLabels,
} from "@/lib/accommodation/status-colors";
import type {
  AccommodationVisualization,
  VizBedNode,
  VizBuildingNode,
  VizFloorNode,
  VizSpaceNode,
} from "@/types/api/accommodation";
import type { VizOverlayItem } from "@/types/accommodation/viz-overlays";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FloorPlanProps {
  visualization: AccommodationVisualization;
  overlays?: VizOverlayItem[];
  onSelectBed?: (bed: VizBedNode, space: VizSpaceNode) => void;
  onSelectSpace?: (space: VizSpaceNode) => void;
}

export function FloorPlan({
  visualization,
  overlays = [],
  onSelectBed,
  onSelectSpace,
}: FloorPlanProps) {
  const [buildingId, setBuildingId] = useState(visualization.buildings[0]?.id ?? "");
  const [floorId, setFloorId] = useState(visualization.buildings[0]?.floors[0]?.id ?? "");

  const building = visualization.buildings.find((b) => b.id === buildingId);
  const floor = building?.floors.find((f) => f.id === floorId);

  const overlayMap = useMemo(() => {
    const map = new Map<string, VizOverlayItem[]>();
    for (const item of overlays) {
      const key = `${item.targetType}:${item.targetId}`;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [overlays]);

  if (!visualization.buildings.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No buildings configured yet. Add structure to visualize occupancy.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {visualization.buildings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              setBuildingId(b.id);
              setFloorId(b.floors[0]?.id ?? "");
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              buildingId === b.id ? "border-teal-600 bg-teal-50 font-medium" : "hover:bg-muted",
            )}
          >
            {b.name}
          </button>
        ))}
      </div>

      {building && building.floors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {building.floors.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorId(f.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                floorId === f.id ? "border-teal-600 bg-teal-50 font-medium" : "hover:bg-muted",
              )}
            >
              Floor {f.floorNumber}
              {f.name ? ` · ${f.name}` : ""}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(spaceStatusLabels).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-3 rounded-sm border",
                spaceStatusColors[status as keyof typeof spaceStatusColors],
              )}
            />
            {label}
          </span>
        ))}
      </div>

      {floor ? (
        <FloorGrid
          floor={floor}
          bedBased={visualization.accommodationMode === "BED_BASED"}
          overlayMap={overlayMap}
          onSelectBed={onSelectBed}
          onSelectSpace={onSelectSpace}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Select a floor to view the plan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FloorGrid({
  floor,
  bedBased,
  overlayMap,
  onSelectBed,
  onSelectSpace,
}: {
  floor: VizFloorNode;
  bedBased: boolean;
  overlayMap: Map<string, VizOverlayItem[]>;
  onSelectBed?: (bed: VizBedNode, space: VizSpaceNode) => void;
  onSelectSpace?: (space: VizSpaceNode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {floor.spaces.map((space) => (
          <motion.div
            key={space.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <SpaceTile
              space={space}
              bedBased={bedBased}
              overlays={overlayMap.get(`space:${space.id}`) ?? []}
              onSelectSpace={onSelectSpace}
              onSelectBed={onSelectBed}
              getBedOverlays={(bedId) => overlayMap.get(`bed:${bedId}`) ?? []}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SpaceTile({
  space,
  bedBased,
  overlays,
  onSelectSpace,
  onSelectBed,
  getBedOverlays,
}: {
  space: VizSpaceNode;
  bedBased: boolean;
  overlays: VizOverlayItem[];
  onSelectSpace?: (space: VizSpaceNode) => void;
  onSelectBed?: (bed: VizBedNode, space: VizSpaceNode) => void;
  getBedOverlays: (bedId: string) => VizOverlayItem[];
}) {
  const color = spaceStatusColors[space.status];

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
        space.blocked && "opacity-70",
      )}
      onClick={() => onSelectSpace?.(space)}
    >
      <div className={cn("h-1.5 border-b", color)} />
      <CardHeader className="space-y-1 p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">
            {space.displayName ?? space.identifier}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {spaceStatusLabels[space.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {space.spaceType}
          {space.currentOccupant && ` · ${space.currentOccupant.residentName}`}
        </p>
      </CardHeader>
      {bedBased && space.beds.length > 0 && (
        <CardContent className="flex flex-wrap gap-1.5 p-3 pt-0">
          {space.beds.map((bed) => (
            <button
              key={bed.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBed?.(bed, space);
              }}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-medium text-white shadow-sm transition-transform hover:scale-105",
                bedStatusColors[bed.status],
              )}
              title={
                bed.currentOccupant
                  ? `${bed.bedLabel}: ${bed.currentOccupant.residentName}`
                  : bed.bedLabel
              }
            >
              {bed.bedLabel}
              {getBedOverlays(bed.id).length > 0 && " •"}
            </button>
          ))}
        </CardContent>
      )}
      {overlays.length > 0 && (
        <CardContent className="border-t bg-muted/30 p-2">
          {overlays.map((o) => (
            <p key={o.id} className="text-[10px] text-muted-foreground">
              {o.label}
            </p>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
