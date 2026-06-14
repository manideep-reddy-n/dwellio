"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Save, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DraggableResizable } from "@/components/accommodation/draggable-resizable";
import {
  bedStatusColors,
  previewBedStyles,
  previewSpaceStyles,
  spaceStatusColors,
  spaceStatusLabels,
} from "@/lib/accommodation/status-colors";
import { canvasSize, resolveLayout, type LayoutRect } from "@/lib/accommodation/layout";
import type {
  AccommodationVisualization,
  VizBedNode,
  VizBuildingNode,
  VizFloorNode,
  VizSpaceNode,
} from "@/types/api/accommodation";
import { cn } from "@/lib/utils";

interface LayoutUpdate {
  buildings?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  floors?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  spaces?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}

type Selection =
  | { kind: "building"; node: VizBuildingNode }
  | { kind: "floor"; node: VizFloorNode; building: VizBuildingNode }
  | { kind: "space"; node: VizSpaceNode; building: VizBuildingNode; floor: VizFloorNode }
  | { kind: "bed"; node: VizBedNode; space: VizSpaceNode; building: VizBuildingNode; floor: VizFloorNode };

interface CommunityBlueprintProps {
  visualization: AccommodationVisualization;
  propertyName?: string;
  allowLayoutEdit?: boolean;
  interactive?: boolean;
  highlightBedId?: string | null;
  highlightSpaceId?: string | null;
  onLayoutSave?: (update: LayoutUpdate) => void;
}

function sharingLabel(bedCount: number): string {
  if (bedCount <= 1) return "Private";
  return `${bedCount}-sharing`;
}

const CAMPUS_HEADER = 52;

type EditLevel = "building" | "floor" | "space";

export function CommunityBlueprint({
  visualization,
  propertyName = "Property",
  allowLayoutEdit = false,
  interactive = true,
  highlightBedId,
  highlightSpaceId,
  onLayoutSave,
}: CommunityBlueprintProps) {
  const [zoom, setZoom] = useState(1);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [editLevel, setEditLevel] = useState<EditLevel>("building");
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState<{
    buildings: Record<string, LayoutRect>;
    floors: Record<string, LayoutRect>;
    spaces: Record<string, LayoutRect>;
  }>({ buildings: {}, floors: {}, spaces: {} });

  const buildings = visualization.buildings;
  const bedBased = visualization.accommodationMode === "BED_BASED";
  const canSelect = interactive && !layoutEditing;

  const getBuildingRect = useCallback(
    (building: VizBuildingNode, index: number) =>
      pending.buildings[building.id] ?? resolveLayout(building.layout, index, "building"),
    [pending.buildings],
  );

  const buildingRects = useMemo(
    () =>
      buildings.map((building, index) => ({
        building,
        rect: {
          ...getBuildingRect(building, index),
          y: Math.max(getBuildingRect(building, index).y, CAMPUS_HEADER + 8),
        },
      })),
    [buildings, getBuildingRect],
  );

  const { width: campusWidth, height: campusHeight } = canvasSize(
    buildingRects.map((b) => b.rect),
    520,
    360,
  );

  function updateBuilding(id: string, rect: LayoutRect) {
    setPending((p) => ({ ...p, buildings: { ...p.buildings, [id]: rect } }));
  }

  function updateFloor(id: string, rect: LayoutRect) {
    setPending((p) => ({ ...p, floors: { ...p.floors, [id]: rect } }));
  }

  function updateSpace(id: string, rect: LayoutRect) {
    setPending((p) => ({ ...p, spaces: { ...p.spaces, [id]: rect } }));
  }

  function startLayoutEdit() {
    setLayoutEditing(true);
    setEditLevel("building");
    setEditTargetId(buildings[0]?.id ?? null);
    setSelection(null);
  }

  function selectEditTarget(level: EditLevel, id: string) {
    setEditLevel(level);
    setEditTargetId(id);
  }

  function handleSaveLayout() {
    const update: LayoutUpdate = {};
    if (Object.keys(pending.buildings).length) {
      update.buildings = Object.entries(pending.buildings).map(([id, rect]) => ({ id, ...rect }));
    }
    if (Object.keys(pending.floors).length) {
      update.floors = Object.entries(pending.floors).map(([id, rect]) => ({ id, ...rect }));
    }
    if (Object.keys(pending.spaces).length) {
      update.spaces = Object.entries(pending.spaces).map(([id, rect]) => ({ id, ...rect }));
    }
    if (update.buildings || update.floors || update.spaces) {
      onLayoutSave?.(update);
    }
    setLayoutEditing(false);
    setEditTargetId(null);
  }

  function handleCancelLayout() {
    setPending({ buildings: {}, floors: {}, spaces: {} });
    setLayoutEditing(false);
    setEditTargetId(null);
  }

  if (!buildings.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No blocks or buildings yet. Add structure in accommodation settings to build your blueprint.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{propertyName}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {layoutEditing
              ? "Select a block, floor, or room — then drag or resize the highlighted item."
              : canSelect
                ? "Click a block, floor, room, or bed to inspect details."
                : "Property layout overview."}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {allowLayoutEdit && !layoutEditing && (
            <Button variant="outline" size="icon-sm" onClick={startLayoutEdit} aria-label="Edit layout">
              <Pencil className="size-4" />
            </Button>
          )}
          {layoutEditing && (
            <>
              <Button size="sm" onClick={handleSaveLayout}>
                <Save className="mr-1 size-3.5" />
                Save
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleCancelLayout} aria-label="Cancel">
                <X className="size-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}>
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </CardHeader>
      {layoutEditing && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3">
          {(["building", "floor", "space"] as const).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={editLevel === level ? "default" : "outline"}
              onClick={() => setEditLevel(level)}
            >
              {level === "building" ? "Blocks" : level === "floor" ? "Floors" : "Rooms"}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">
            Tap an item on the map to select it for editing
          </span>
        </div>
      )}
      <CardContent className="space-y-4">
        <div className="overflow-auto rounded-xl border bg-slate-50/50 p-2 sm:p-4 dark:bg-muted/10">
          <div
            className="relative mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-background"
            style={{
              width: campusWidth,
              height: campusHeight,
              zoom,
            }}
          >
            <div className="absolute inset-x-0 top-0 flex h-[52px] items-center justify-center border-b border-slate-100 bg-slate-50/80 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-muted/30 dark:text-slate-100">
              {propertyName}
            </div>
            {buildingRects.map(({ building, rect }, buildingIndex) => (
              <DraggableResizable
                key={building.id}
                rect={rect}
                editing={layoutEditing && editLevel === "building"}
                active={editTargetId === building.id}
                zoom={1}
                minWidth={140}
                minHeight={120}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow",
                  selection?.kind === "building" && selection.node.id === building.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-slate-200 dark:border-slate-700",
                  layoutEditing && editLevel === "building" && "cursor-pointer",
                )}
                onChange={(next) => updateBuilding(building.id, next)}
              >
                <button
                  type="button"
                  disabled={!canSelect && !layoutEditing}
                  className={cn(
                    "flex w-full items-center gap-1 border-b bg-slate-50 px-2.5 py-2 text-left dark:bg-muted/40",
                    (canSelect || layoutEditing) && "cursor-pointer hover:bg-slate-100 dark:hover:bg-muted/60",
                  )}
                  onClick={() => {
                    if (layoutEditing) selectEditTarget("building", building.id);
                    else if (canSelect) setSelection({ kind: "building", node: building });
                  }}
                >
                  <span className="truncate text-xs font-semibold">{building.name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {building.floors.length}F
                  </Badge>
                </button>
                <div className="relative flex-1 overflow-hidden bg-muted/10">
                  {building.floors.map((floor, floorIndex) => {
                    const floorRect =
                      pending.floors[floor.id] ??
                      resolveLayout(floor.layout, floorIndex, "floor");
                    return (
                      <DraggableResizable
                        key={floor.id}
                        rect={floorRect}
                        editing={layoutEditing && editLevel === "floor"}
                        active={editTargetId === floor.id}
                        zoom={1}
                        minWidth={72}
                        minHeight={52}
                        className={cn(
                          "rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-muted/20",
                          selection?.kind === "floor" && selection.node.id === floor.id && "ring-2 ring-sky-400/60",
                          layoutEditing && editLevel === "floor" && "cursor-pointer",
                        )}
                        onChange={(next) => updateFloor(floor.id, next)}
                      >
                        <button
                          type="button"
                          disabled={!canSelect && !layoutEditing}
                          className={cn(
                            "mb-1 w-full truncate text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300",
                            (canSelect || layoutEditing) && "cursor-pointer hover:text-foreground",
                          )}
                          onClick={() => {
                            if (layoutEditing) selectEditTarget("floor", floor.id);
                            else if (canSelect) setSelection({ kind: "floor", node: floor, building });
                          }}
                        >
                          {floor.name ?? `Floor ${floor.floorNumber}`}
                        </button>
                        <div className="relative h-[calc(100%-18px)]">
                          {floor.spaces.map((space, spaceIndex) => {
                            const spaceRect =
                              pending.spaces[space.id] ??
                              resolveLayout(space.layout, spaceIndex, "space");
                            return (
                              <DraggableResizable
                                key={space.id}
                                rect={spaceRect}
                                editing={layoutEditing && editLevel === "space"}
                                active={editTargetId === space.id}
                                zoom={1}
                                minWidth={64}
                                minHeight={48}
                                className={cn(
                                  "overflow-hidden rounded-md",
                                  layoutEditing && editLevel === "space" && "cursor-pointer",
                                )}
                                onChange={(next) => updateSpace(space.id, next)}
                              >
                                <RoomContent
                                  space={space}
                                  bedBased={bedBased}
                                  previewMode={!layoutEditing}
                                  highlighted={highlightSpaceId === space.id}
                                  highlightBedId={highlightBedId}
                                  selected={selection}
                                  canSelect={canSelect}
                                  onSelectSpace={(s) => {
                                    if (layoutEditing) selectEditTarget("space", s.id);
                                    else setSelection({ kind: "space", node: s, building, floor });
                                  }}
                                  onSelectBed={(bed, s) =>
                                    setSelection({ kind: "bed", node: bed, space: s, building, floor })
                                  }
                                />
                              </DraggableResizable>
                            );
                          })}
                        </div>
                      </DraggableResizable>
                    );
                  })}
                </div>
              </DraggableResizable>
            ))}
          </div>
        </div>

        {selection && canSelect && (
          <SelectionPanel selection={selection} bedBased={bedBased} onClose={() => setSelection(null)} />
        )}
      </CardContent>
    </Card>
  );
}

function SelectionPanel({
  selection,
  bedBased,
  onClose,
}: {
  selection: Selection;
  bedBased: boolean;
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {selection.kind}
          </p>
          <p className="text-lg font-semibold">
            {selection.kind === "building" && selection.node.name}
            {selection.kind === "floor" &&
              (selection.node.name ?? `Floor ${selection.node.floorNumber}`)}
            {selection.kind === "space" &&
              (selection.node.displayName ?? selection.node.identifier)}
            {selection.kind === "bed" && `Bed ${selection.node.bedLabel}`}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close details">
          <X className="size-4" />
        </Button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {selection.kind !== "building" && (
          <Detail label="Block" value={selection.building.name} />
        )}
        {(selection.kind === "space" || selection.kind === "bed") && (
          <Detail
            label="Floor"
            value={selection.floor.name ?? `Floor ${selection.floor.floorNumber}`}
          />
        )}
        {selection.kind === "bed" && (
          <Detail label="Room" value={selection.space.displayName ?? selection.space.identifier} />
        )}
        {(selection.kind === "space" || selection.kind === "bed") && (
          <Detail label="Status" value={spaceStatusLabels[selection.kind === "space" ? selection.node.status : selection.space.status]} />
        )}
        {selection.kind === "bed" && (
          <Detail label="Bed status" value={selection.node.status} />
        )}
        {selection.kind === "space" && bedBased && (
          <Detail label="Sharing" value={sharingLabel(selection.node.beds.length)} />
        )}
        {selection.kind === "space" && !bedBased && selection.node.currentOccupant && (
          <Detail label="Occupant" value={selection.node.currentOccupant.residentName} />
        )}
        {selection.kind === "floor" && (
          <Detail label="Rooms" value={String(selection.node.spaces.length)} />
        )}
        {selection.kind === "building" && (
          <Detail label="Floors" value={String(selection.node.floors.length)} />
        )}
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function RoomContent({
  space,
  bedBased,
  previewMode = true,
  highlighted,
  highlightBedId,
  selected,
  canSelect,
  onSelectSpace,
  onSelectBed,
}: {
  space: VizSpaceNode;
  bedBased: boolean;
  previewMode?: boolean;
  highlighted?: boolean;
  highlightBedId?: string | null;
  selected: Selection | null;
  canSelect: boolean;
  onSelectSpace: (space: VizSpaceNode) => void;
  onSelectBed: (bed: VizBedNode, space: VizSpaceNode) => void;
}) {
  const isSelected =
    (selected?.kind === "space" && selected.node.id === space.id) ||
    (selected?.kind === "bed" && selected.space.id === space.id);

  const interactive = canSelect || !previewMode;

  return (
    <button
      type="button"
      disabled={!interactive}
      className={cn(
        "h-full w-full rounded-md p-1.5 text-left",
        previewMode ? previewSpaceStyles[space.status] : cn("text-white", spaceStatusColors[space.status]),
        highlighted && "ring-2 ring-primary/50",
        isSelected && "ring-2 ring-primary",
        interactive && "cursor-pointer hover:opacity-95",
      )}
      onClick={() => interactive && onSelectSpace(space)}
    >
      <p className="truncate text-[11px] font-semibold">{space.displayName ?? space.identifier}</p>
      <p className="text-[10px] opacity-80">{bedBased ? sharingLabel(space.beds.length) : "Unit"}</p>
      {bedBased && space.beds.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {space.beds.map((bed: VizBedNode) => (
            <span
              key={bed.id}
              role="button"
              tabIndex={canSelect ? 0 : -1}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium",
                previewMode ? previewBedStyles[bed.status] : bedStatusColors[bed.status],
                highlightBedId === bed.id && "ring-2 ring-primary",
                selected?.kind === "bed" && selected.node.id === bed.id && "ring-2 ring-primary",
                canSelect && "cursor-pointer",
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (canSelect) onSelectBed(bed, space);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  if (canSelect) onSelectBed(bed, space);
                }
              }}
            >
              {bed.bedLabel}
            </span>
          ))}
        </div>
      )}
      <p className="mt-0.5 text-[9px] font-medium opacity-70">{spaceStatusLabels[space.status]}</p>
    </button>
  );
}
