"use client";

import { useState } from "react";
import { AccommodationStructureNav } from "@/components/accommodation/accommodation-structure-nav";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccommodationMutations,
  useAccommodationVisualization,
  useOccupancies,
} from "@/hooks/use-accommodation";
import { usePermissions } from "@/hooks/use-permissions";
import { useResidents } from "@/hooks/use-residents";
import type { VizBedNode, VizSpaceNode } from "@/types/api/accommodation";
import { toast } from "sonner";

interface AccommodationManagerProps {
  orgId: string;
}

export function AccommodationManager({ orgId }: AccommodationManagerProps) {
  const { activeOrg } = usePermissions();
  const { data: viz, isLoading, isError, refetch } = useAccommodationVisualization(orgId);
  const { data: occupancies } = useOccupancies(orgId);
  const { data: residents } = useResidents(orgId);
  const mutations = useAccommodationMutations(orgId);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<VizBedNode | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<VizSpaceNode | null>(null);
  const [membershipId, setMembershipId] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("8000");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferOpen, setTransferOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [transferMembershipId, setTransferMembershipId] = useState("");
  const [releaseOccupancyId, setReleaseOccupancyId] = useState("");
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  async function handleAllocate() {
    if (!membershipId || !moveInDate) return;
    try {
      await mutations.allocate.mutateAsync({
        membershipId,
        bedId: selectedBed?.id,
        unitSpaceId: selectedSpace && !selectedBed ? selectedSpace.id : undefined,
        moveInDate,
        monthlyRent: Number(monthlyRent) || undefined,
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
        <div className="space-y-6">
          <AccommodationStructureNav
            visualization={viz}
            occupancies={occupancies}
            mutations={mutations}
            onSelectBed={(bed, space) => openAllocate(bed, space)}
            onSelectSpace={(space) => openAllocate(null, space)}
          />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Resident preview</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              This is what residents see. Use the pencil icon to adjust block positions only.
            </p>
            <FloorPlan
              visualization={viz}
              propertyName={activeOrg?.name ?? "Property"}
              allowLayoutEdit
              onLayoutSave={(update) => mutations.updateLayout.mutate(update)}
            />
          </div>
        </div>
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
            {viz?.accommodationMode === "BED_BASED" && (
              <div className="space-y-1">
                <Label>Monthly rent (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="e.g. 8000"
                />
                <p className="text-xs text-muted-foreground">
                  Rent is billed monthly from move-in date. Each resident can have a different amount.
                </p>
              </div>
            )}
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
