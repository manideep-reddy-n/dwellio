"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FloorPlan } from "@/components/accommodation/floor-plan";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccommodationMutations,
  useAccommodationVisualization,
  useOccupancies,
} from "@/hooks/use-accommodation";
import { useResidents } from "@/hooks/use-residents";
import type { VizBedNode, VizSpaceNode } from "@/types/api/accommodation";
import { toast } from "sonner";

interface AccommodationManagerProps {
  orgId: string;
}

export function AccommodationManager({ orgId }: AccommodationManagerProps) {
  const { data: viz, isLoading, isError, refetch } = useAccommodationVisualization(orgId);
  const { data: occupancies } = useOccupancies(orgId);
  const { data: residents } = useResidents(orgId);
  const mutations = useAccommodationMutations(orgId);

  const [structureOpen, setStructureOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [buildingName, setBuildingName] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [spaceId, setSpaceIdentifier] = useState("");
  const [bedLabel, setBedLabel] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [selectedBed, setSelectedBed] = useState<VizBedNode | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<VizSpaceNode | null>(null);
  const [membershipId, setMembershipId] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferOpen, setTransferOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [transferMembershipId, setTransferMembershipId] = useState("");
  const [releaseOccupancyId, setReleaseOccupancyId] = useState("");
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  async function handleAddBuilding() {
    if (!buildingName.trim()) return;
    try {
      await mutations.createBuilding.mutateAsync({ name: buildingName.trim() });
      toast.success("Building created");
      setBuildingName("");
    } catch {
      toast.error("Could not create building");
    }
  }

  async function handleAddFloor() {
    if (!selectedBuildingId) {
      toast.error("Select a building first");
      return;
    }
    try {
      await mutations.createFloor.mutateAsync({
        buildingId: selectedBuildingId,
        body: { floorNumber: Number(floorNumber), name: `Floor ${floorNumber}` },
      });
      toast.success("Floor created");
    } catch {
      toast.error("Could not create floor");
    }
  }

  async function handleAddSpace() {
    if (!selectedFloorId || !spaceId.trim()) return;
    try {
      await mutations.createSpace.mutateAsync({
        floorId: selectedFloorId,
        body: { identifier: spaceId.trim() },
      });
      toast.success("Space created");
      setSpaceIdentifier("");
    } catch {
      toast.error("Could not create space");
    }
  }

  async function handleAddBed() {
    if (!selectedSpaceId || !bedLabel.trim()) return;
    try {
      await mutations.createBed.mutateAsync({
        spaceId: selectedSpaceId,
        bedLabel: bedLabel.trim(),
      });
      toast.success("Bed created");
      setBedLabel("");
    } catch {
      toast.error("Could not create bed");
    }
  }

  async function handleAllocate() {
    if (!membershipId || !moveInDate) return;
    try {
      await mutations.allocate.mutateAsync({
        membershipId,
        bedId: selectedBed?.id,
        unitSpaceId: selectedSpace && !selectedBed ? selectedSpace.id : undefined,
        moveInDate,
      });
      toast.success("Allocated");
      setAllocateOpen(false);
    } catch {
      toast.error("Could not allocate");
    }
  }

  async function handleTransfer() {
    if (!transferMembershipId) return;
    try {
      await mutations.transfer.mutateAsync({
        membershipId: transferMembershipId,
        targetBedId: selectedBed?.id,
        targetUnitSpaceId: selectedSpace && !selectedBed ? selectedSpace.id : undefined,
        transferDate: moveInDate,
      });
      toast.success("Transferred");
      setTransferOpen(false);
    } catch {
      toast.error("Could not transfer");
    }
  }

  async function handleRelease() {
    if (!releaseOccupancyId) return;
    try {
      await mutations.release.mutateAsync({
        occupancyId: releaseOccupancyId,
        moveOutDate: moveOutDate,
      });
      toast.success("Released");
      setReleaseOpen(false);
    } catch {
      toast.error("Could not release");
    }
  }

  const openAllocate = (bed?: VizBedNode | null, space?: VizSpaceNode | null) => {
    setSelectedBed(bed ?? null);
    setSelectedSpace(space ?? null);
    setAllocateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
          <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
            <Plus className="size-4" />
            Add structure
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Accommodation structure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border p-3">
                <Label>Building</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Building name"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                  />
                  <Button onClick={() => void handleAddBuilding()}>Add</Button>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <Label>Floor</Label>
                <select
                  className="mb-2 flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                >
                  <option value="">Building…</option>
                  {viz?.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value)}
                  />
                  <Button onClick={() => void handleAddFloor()}>Add floor</Button>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <Label>Space / Room</Label>
                <select
                  className="mb-2 flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                >
                  <option value="">Floor…</option>
                  {viz?.buildings.flatMap((b) =>
                    b.floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {b.name} · Floor {f.floorNumber}
                      </option>
                    )),
                  )}
                </select>
                <div className="flex gap-2">
                  <Input
                    placeholder="Room 101"
                    value={spaceId}
                    onChange={(e) => setSpaceIdentifier(e.target.value)}
                  />
                  <Button onClick={() => void handleAddSpace()}>Add</Button>
                </div>
              </div>
              {viz?.accommodationMode === "BED_BASED" && (
                <div className="space-y-2 rounded-lg border p-3">
                  <Label>Bed</Label>
                  <select
                    className="mb-2 flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    value={selectedSpaceId}
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                  >
                    <option value="">Space…</option>
                    {viz.buildings.flatMap((b) =>
                      b.floors.flatMap((f) =>
                        f.spaces.map((s) => (
                          <option key={s.id} value={s.id}>
                            {b.name} · {s.identifier}
                          </option>
                        )),
                      ),
                    )}
                  </select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="A"
                      value={bedLabel}
                      onChange={(e) => setBedLabel(e.target.value)}
                    />
                    <Button onClick={() => void handleAddBed()}>Add bed</Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStructureOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={() => openAllocate()}>Allocate resident</Button>
        <Button variant="outline" onClick={() => setTransferOpen(true)}>
          Transfer
        </Button>
        <Button variant="outline" onClick={() => setReleaseOpen(true)}>
          Release
        </Button>
      </div>

      {occupancies && occupancies.length > 0 && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-2 text-sm font-semibold">Current occupancies</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {occupancies
              .filter((o) => o.current)
              .map((o) => (
                <div key={o.id} className="flex justify-between">
                  <span>{o.residentName}</span>
                  <span>{o.bedLabel ?? o.unitIdentifier ?? "—"}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {viz ? (
        <FloorPlan
          visualization={viz}
          onSelectBed={(bed, space) => openAllocate(bed, space)}
          onSelectSpace={(space) => openAllocate(null, space)}
        />
      ) : (
        <EmptyState title="No visualization data" />
      )}

      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate occupancy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(selectedBed || selectedSpace) && (
              <p className="text-sm text-muted-foreground">
                Target:{" "}
                {selectedBed
                  ? `Bed ${selectedBed.bedLabel}`
                  : selectedSpace?.displayName ?? selectedSpace?.identifier}
              </p>
            )}
            <div className="space-y-1">
              <Label>Resident</Label>
              <select
                className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
              >
                <option value="">Select resident…</option>
                {residents?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.userFullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Move-in date</Label>
              <Input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={mutations.allocate.isPending} onClick={() => void handleAllocate()}>
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer occupancy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Resident</Label>
              <select
                className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={transferMembershipId}
                onChange={(e) => setTransferMembershipId(e.target.value)}
              >
                <option value="">Select resident…</option>
                {occupancies
                  ?.filter((o) => o.current)
                  .map((o) => (
                    <option key={o.membershipId} value={o.membershipId}>
                      {o.residentName}
                    </option>
                  ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a bed or room on the floor plan as the transfer target, then confirm.
            </p>
            <div className="space-y-1">
              <Label>Transfer date</Label>
              <Input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button disabled={mutations.transfer.isPending} onClick={() => void handleTransfer()}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release occupancy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Occupancy</Label>
              <select
                className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={releaseOccupancyId}
                onChange={(e) => setReleaseOccupancyId(e.target.value)}
              >
                <option value="">Select…</option>
                {occupancies
                  ?.filter((o) => o.current)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.residentName} — {o.bedLabel ?? o.unitIdentifier}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Move-out date</Label>
              <Input
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseOpen(false)}>
              Cancel
            </Button>
            <Button disabled={mutations.release.isPending} onClick={() => void handleRelease()}>
              Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
