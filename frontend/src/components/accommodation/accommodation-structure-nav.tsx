"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Layers,
  MoreVertical,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bedStatusColors,
  spaceStatusColors,
  spaceStatusLabels,
} from "@/lib/accommodation/status-colors";
import type {
  AccommodationVisualization,
  StaffOccupancy,
  VizBedNode,
  VizBuildingNode,
  VizFloorNode,
  VizSpaceNode,
} from "@/types/api/accommodation";
import type { useAccommodationMutations } from "@/hooks/use-accommodation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccommodationStructureNavProps {
  visualization: AccommodationVisualization;
  occupancies?: StaffOccupancy[];
  mutations: ReturnType<typeof useAccommodationMutations>;
  onSelectBed?: (bed: VizBedNode, space: VizSpaceNode) => void;
  onSelectSpace?: (space: VizSpaceNode) => void;
}

type View =
  | { level: "buildings" }
  | { level: "floors"; building: VizBuildingNode }
  | { level: "spaces"; building: VizBuildingNode; floor: VizFloorNode };

type DeleteTarget =
  | { type: "building"; id: string; name: string; residentCount: number }
  | { type: "floor"; id: string; name: string; residentCount: number }
  | { type: "space"; id: string; name: string; residentCount: number }
  | { type: "bed"; id: string; name: string; residentCount: number };

function sharingLabel(count: number): string {
  if (count <= 1) return "Private";
  return `${count}-sharing`;
}

export function AccommodationStructureNav({
  visualization,
  occupancies = [],
  mutations,
  onSelectBed,
  onSelectSpace,
}: AccommodationStructureNavProps) {
  const [view, setView] = useState<View>({ level: "buildings" });
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [floorNumberInput, setFloorNumberInput] = useState("1");
  const [editId, setEditId] = useState("");
  const [editType, setEditType] = useState<DeleteTarget["type"]>("building");
  const [addBedSpaceId, setAddBedSpaceId] = useState<string | null>(null);

  const bedBased = visualization.accommodationMode === "BED_BASED";
  const current = occupancies.filter((o) => o.current);

  const residentCountForBuilding = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of visualization.buildings) {
      const spaceIds = new Set(
        b.floors.flatMap((f) => f.spaces.map((s) => s.id)),
      );
      const bedIds = new Set(
        b.floors.flatMap((f) => f.spaces.flatMap((s) => s.beds.map((bed) => bed.id))),
      );
      map.set(
        b.id,
        current.filter(
          (o) =>
            (o.bedId && bedIds.has(o.bedId)) ||
            (o.unitSpaceId && spaceIds.has(o.unitSpaceId)),
        ).length,
      );
    }
    return map;
  }, [visualization.buildings, current]);

  function residentCountForFloor(floor: VizFloorNode) {
    const spaceIds = new Set(floor.spaces.map((s) => s.id));
    const bedIds = new Set(floor.spaces.flatMap((s) => s.beds.map((b) => b.id)));
    return current.filter(
      (o) =>
        (o.bedId && bedIds.has(o.bedId)) || (o.unitSpaceId && spaceIds.has(o.unitSpaceId)),
    ).length;
  }

  function residentCountForSpace(space: VizSpaceNode) {
    const bedIds = new Set(space.beds.map((b) => b.id));
    return current.filter(
      (o) =>
        (o.bedId && bedIds.has(o.bedId)) || (o.unitSpaceId === space.id),
    ).length;
  }

  function residentCountForBed(bedId: string) {
    return current.filter((o) => o.bedId === bedId).length;
  }

  const addLabel =
    view.level === "buildings"
      ? "Add new block"
      : view.level === "floors"
        ? "Add new floor"
        : bedBased
          ? "Add new room"
          : "Add new unit";

  async function handleAdd() {
    try {
      if (view.level === "buildings") {
        if (!nameInput.trim()) return;
        await mutations.createBuilding.mutateAsync({ name: nameInput.trim() });
        toast.success("Block created");
      } else if (view.level === "floors") {
        await mutations.createFloor.mutateAsync({
          buildingId: view.building.id,
          body: {
            floorNumber: Number(floorNumberInput) || 1,
            name: nameInput.trim() || `Floor ${floorNumberInput}`,
          },
        });
        toast.success("Floor created");
      } else if (view.level === "spaces") {
        if (!nameInput.trim()) return;
        await mutations.createSpace.mutateAsync({
          floorId: view.floor.id,
          body: { identifier: nameInput.trim() },
        });
        toast.success(bedBased ? "Room created" : "Unit created");
      }
      setNameInput("");
      setAddOpen(false);
    } catch {
      toast.error("Could not create");
    }
  }

  async function handleAddBed(space: VizSpaceNode) {
    if (!nameInput.trim()) return;
    try {
      await mutations.createBed.mutateAsync({
        spaceId: space.id,
        bedLabel: nameInput.trim(),
      });
      toast.success("Bed created");
      setNameInput("");
      setAddBedSpaceId(null);
      setAddOpen(false);
    } catch {
      toast.error("Could not create bed");
    }
  }

  async function handleEdit() {
    try {
      if (editType === "building") {
        await mutations.updateBuilding.mutateAsync({
          buildingId: editId,
          body: { name: nameInput.trim() },
        });
      } else if (editType === "floor") {
        await mutations.updateFloor.mutateAsync({
          floorId: editId,
          body: { name: nameInput.trim() },
        });
      } else if (editType === "space") {
        await mutations.updateSpace.mutateAsync({
          spaceId: editId,
          body: { identifier: nameInput.trim() },
        });
      } else {
        await mutations.updateBed.mutateAsync({
          bedId: editId,
          body: { bedLabel: nameInput.trim() },
        });
      }
      toast.success("Updated");
      setEditOpen(false);
    } catch {
      toast.error("Could not update");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "building") {
        await mutations.deleteBuilding.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.type === "floor") {
        await mutations.deleteFloor.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.type === "space") {
        await mutations.deleteSpace.mutateAsync(deleteTarget.id);
      } else {
        await mutations.deleteBed.mutateAsync(deleteTarget.id);
      }
      toast.success(
        deleteTarget.residentCount > 0
          ? `Deleted and unallocated ${deleteTarget.residentCount} resident(s)`
          : "Deleted",
      );
      setDeleteTarget(null);
      if (view.level === "floors" && deleteTarget.type === "building") {
        setView({ level: "buildings" });
      }
      if (view.level === "spaces" && (deleteTarget.type === "floor" || deleteTarget.type === "building")) {
        setView({ level: "buildings" });
      }
    } catch {
      toast.error("Could not delete");
    }
  }

  function openEdit(type: DeleteTarget["type"], id: string, currentName: string) {
    setEditType(type);
    setEditId(id);
    setNameInput(currentName);
    setEditOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Structure management</CardTitle>
              <p className="text-xs text-muted-foreground">
                Browse and manage blocks, floors, and {bedBased ? "rooms & beds" : "units"}.
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => { setAddBedSpaceId(null); setAddOpen(true); }}>
              <Plus className="size-4" />
              {addLabel}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1 pt-1 text-xs text-muted-foreground">
            <button type="button" className="hover:text-foreground" onClick={() => setView({ level: "buildings" })}>
              All blocks
            </button>
            {view.level !== "buildings" && (
              <>
                <ChevronRight className="size-3" />
                <span className="font-medium text-foreground">{view.building.name}</span>
              </>
            )}
            {view.level === "spaces" && (
              <>
                <ChevronRight className="size-3" />
                <span className="font-medium text-foreground">
                  {view.floor.name ?? `Floor ${view.floor.floorNumber}`}
                </span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {view.level !== "buildings" && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-0 text-muted-foreground"
              onClick={() =>
                setView(
                  view.level === "spaces"
                    ? { level: "floors", building: view.building }
                    : { level: "buildings" },
                )
              }
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
          )}

          {view.level === "buildings" &&
            visualization.buildings.map((building) => (
              <StructureRow
                key={building.id}
                icon={<Building2 className="size-4 text-teal-600" />}
                title={building.name}
                subtitle={`${building.floors.length} floor${building.floors.length === 1 ? "" : "s"}`}
                onOpen={() => setView({ level: "floors", building })}
                onEdit={() => openEdit("building", building.id, building.name)}
                onDelete={() =>
                  setDeleteTarget({
                    type: "building",
                    id: building.id,
                    name: building.name,
                    residentCount: residentCountForBuilding.get(building.id) ?? 0,
                  })
                }
              />
            ))}

          {view.level === "floors" &&
            view.building.floors.map((floor) => (
              <StructureRow
                key={floor.id}
                icon={<Layers className="size-4 text-teal-600" />}
                title={floor.name ?? `Floor ${floor.floorNumber}`}
                subtitle={`${floor.spaces.length} ${bedBased ? "room" : "unit"}${floor.spaces.length === 1 ? "" : "s"}`}
                onOpen={() => setView({ level: "spaces", building: view.building, floor })}
                onEdit={() =>
                  openEdit("floor", floor.id, floor.name ?? `Floor ${floor.floorNumber}`)
                }
                onDelete={() =>
                  setDeleteTarget({
                    type: "floor",
                    id: floor.id,
                    name: floor.name ?? `Floor ${floor.floorNumber}`,
                    residentCount: residentCountForFloor(floor),
                  })
                }
              />
            ))}

          {view.level === "spaces" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {view.floor.spaces.map((space) => (
                <div
                  key={space.id}
                  className={cn("rounded-lg border p-3", spaceStatusColors[space.status], "text-white")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <DoorOpen className="size-4 shrink-0 opacity-90" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {space.displayName ?? space.identifier}
                        </p>
                        <p className="text-xs opacity-90">
                          {bedBased ? sharingLabel(space.beds.length) : "Unit"} ·{" "}
                          {spaceStatusLabels[space.status]}
                        </p>
                      </div>
                    </div>
                    <ItemMenu
                      onEdit={() =>
                        openEdit("space", space.id, space.displayName ?? space.identifier)
                      }
                      onDelete={() =>
                        setDeleteTarget({
                          type: "space",
                          id: space.id,
                          name: space.displayName ?? space.identifier,
                          residentCount: residentCountForSpace(space),
                        })
                      }
                    />
                  </div>
                  {bedBased && space.beds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {space.beds.map((bed) => (
                        <div key={bed.id} className="flex items-center gap-0.5">
                          <button
                            type="button"
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              bedStatusColors[bed.status],
                              onSelectBed && "cursor-pointer hover:opacity-90",
                            )}
                            onClick={() => onSelectBed?.(bed, space)}
                          >
                            Bed {bed.bedLabel}
                          </button>
                          <ItemMenu
                            compact
                            onEdit={() => openEdit("bed", bed.id, bed.bedLabel)}
                            onDelete={() =>
                              setDeleteTarget({
                                type: "bed",
                                id: bed.id,
                                name: `Bed ${bed.bedLabel}`,
                                residentCount: residentCountForBed(bed.id),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {bedBased && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 h-7 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => {
                        setNameInput("");
                        setAddBedSpaceId(space.id);
                        setAddOpen(true);
                      }}
                    >
                      <Plus className="mr-1 size-3" />
                      Add bed
                    </Button>
                  )}
                  {!bedBased && onSelectSpace && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 h-7 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => onSelectSpace(space)}
                    >
                      Allocate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {view.level === "buildings" && visualization.buildings.length === 0 && (
            <p className="text-sm text-muted-foreground">No blocks yet. Add your first block above.</p>
          )}
          {view.level === "floors" && view.building.floors.length === 0 && (
            <p className="text-sm text-muted-foreground">No floors in this block yet.</p>
          )}
          {view.level === "spaces" && view.floor.spaces.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No {bedBased ? "rooms" : "units"} on this floor yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{addBedSpaceId ? "Add new bed" : addLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {view.level === "floors" && !addBedSpaceId && (
              <div className="space-y-1">
                <Label>Floor number</Label>
                <Input
                  type="number"
                  min={0}
                  value={floorNumberInput}
                  onChange={(e) => setFloorNumberInput(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>
                {addBedSpaceId
                  ? "Bed label"
                  : view.level === "buildings"
                    ? "Block name"
                    : view.level === "floors"
                      ? "Floor name (optional)"
                      : bedBased
                        ? "Room identifier"
                        : "Unit identifier"}
              </Label>
              <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addBedSpaceId && view.level === "spaces") {
                  const space = view.floor.spaces.find((s) => s.id === addBedSpaceId);
                  if (space) void handleAddBed(space);
                } else {
                  void handleAdd();
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleEdit()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          {deleteTarget && deleteTarget.residentCount > 0 ? (
            <p className="text-sm text-rose-700">
              {deleteTarget.residentCount} resident
              {deleteTarget.residentCount === 1 ? " is" : "s are"} currently assigned inside this{" "}
              {deleteTarget.type}. Deleting will unallocate them — you must re-assign them afterward.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StructureRow({
  icon,
  title,
  subtitle,
  onOpen,
  onEdit,
  onDelete,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center justify-between text-left transition-colors hover:bg-muted/40 rounded-md p-1 -m-1"
        onClick={onOpen}
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <ItemMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function ItemMenu({
  onEdit,
  onDelete,
  compact,
}: {
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(compact && "size-6")}
            aria-label="Actions"
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Rename</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
