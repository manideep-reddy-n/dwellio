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
import { ApiError } from "@/lib/api/client";
import type { VizBedNode, VizSpaceNode } from "@/types/api/accommodation";
import { toast } from "sonner";

interface AccommodationManagerProps {
  orgId: string;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
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
  const [occupancyClassification, setOccupancyClassification] = useState<
    "RESIDENT" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED"
  >("TENANT_OCCUPIED");

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMembershipId, setTransferMembershipId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferTargetBed, setTransferTargetBed] = useState<VizBedNode | null>(null);
  const [transferTargetSpace, setTransferTargetSpace] = useState<VizSpaceNode | null>(null);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseOccupancyId, setReleaseOccupancyId] = useState("");
  const [releaseResidentName, setReleaseResidentName] = useState("");
  const [releaseTargetLabel, setReleaseTargetLabel] = useState("");
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  const [editRentOpen, setEditRentOpen] = useState(false);
  const [editRentOccupancyId, setEditRentOccupancyId] = useState("");
  const [editRentResidentName, setEditRentResidentName] = useState("");
  const [editRentTargetLabel, setEditRentTargetLabel] = useState("");
  const [editRentAmount, setEditRentAmount] = useState("");

  const currentOccupancies = occupancies?.filter((o) => o.current) ?? [];
  const allocatedMembershipIds = new Set(currentOccupancies.map((o) => o.membershipId));
  const unallocatedResidents =
    residents?.filter((r) => !allocatedMembershipIds.has(r.id)) ?? [];

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  function findOccupancyByBedId(bedId: string) {
    return currentOccupancies.find((o) => o.bedId === bedId);
  }

  function findOccupancyBySpaceId(spaceId: string) {
    return currentOccupancies.find((o) => o.unitSpaceId === spaceId);
  }

  function openAllocate(bed?: VizBedNode | null, space?: VizSpaceNode | null) {
    setSelectedBed(bed ?? null);
    setSelectedSpace(space ?? null);
    setAllocateOpen(true);
  }

  function openReleaseFromOccupancy(
    occupancyId: string,
    residentName: string,
    targetLabel: string,
  ) {
    setReleaseOccupancyId(occupancyId);
    setReleaseResidentName(residentName);
    setReleaseTargetLabel(targetLabel);
    setReleaseOpen(true);
  }

  function openReleaseForBed(bed: VizBedNode, space: VizSpaceNode) {
    const occupancy = findOccupancyByBedId(bed.id);
    if (!occupancy) {
      toast.error("No active occupancy found for this bed");
      return;
    }
    openReleaseFromOccupancy(
      occupancy.id,
      occupancy.residentName,
      `Bed ${bed.bedLabel} · ${space.displayName ?? space.identifier}`,
    );
  }

  function openReleaseForSpace(space: VizSpaceNode) {
    const occupancy = findOccupancyBySpaceId(space.id);
    if (!occupancy) {
      toast.error("No active occupancy found for this unit");
      return;
    }
    openReleaseFromOccupancy(
      occupancy.id,
      occupancy.residentName,
      space.displayName ?? space.identifier,
    );
  }

  function openEditRentForBed(bed: VizBedNode, space: VizSpaceNode) {
    const occupancy = findOccupancyByBedId(bed.id);
    if (!occupancy) {
      toast.error("No active occupancy found for this bed");
      return;
    }
    setEditRentOccupancyId(occupancy.id);
    setEditRentResidentName(occupancy.residentName);
    setEditRentTargetLabel(`Bed ${bed.bedLabel} · ${space.displayName ?? space.identifier}`);
    setEditRentAmount(String(occupancy.monthlyRent ?? ""));
    setEditRentOpen(true);
  }

  async function handleUpdateRent() {
    if (!editRentOccupancyId) return;
    const amount = Number(editRentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid monthly rent");
      return;
    }
    try {
      await mutations.updateRent.mutateAsync({
        occupancyId: editRentOccupancyId,
        monthlyRent: amount,
      });
      toast.success("Rent updated");
      setEditRentOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update rent"));
    }
  }

  function handleBedSelect(bed: VizBedNode, space: VizSpaceNode) {
    if (transferOpen) {
      if (bed.status === "OCCUPIED" || bed.currentOccupant) {
        toast.error("Choose an available bed as the transfer target");
        return;
      }
      setTransferTargetBed(bed);
      setTransferTargetSpace(space);
      return;
    }
    if (bed.status === "OCCUPIED" || bed.currentOccupant) {
      openReleaseForBed(bed, space);
      return;
    }
    openAllocate(bed, space);
  }

  function handleSpaceSelect(space: VizSpaceNode) {
    if (transferOpen) {
      if (space.status === "OCCUPIED" || space.currentOccupant) {
        toast.error("Choose an available unit as the transfer target");
        return;
      }
      setTransferTargetBed(null);
      setTransferTargetSpace(space);
      return;
    }
    if (space.status === "OCCUPIED" || space.currentOccupant) {
      openReleaseForSpace(space);
      return;
    }
    openAllocate(null, space);
  }

  function openTransferDialog() {
    setTransferTargetBed(null);
    setTransferTargetSpace(null);
    setTransferOpen(true);
  }

  async function handleAllocate() {
    if (!membershipId || !moveInDate) return;
    try {
      await mutations.allocate.mutateAsync({
        membershipId,
        bedId: selectedBed?.id,
        unitSpaceId: selectedSpace && !selectedBed ? selectedSpace.id : undefined,
        moveInDate,
        monthlyRent: Number(monthlyRent) || undefined,
        occupancyClassification:
          viz?.accommodationMode === "UNIT_BASED" ? occupancyClassification : undefined,
      });
      toast.success("Allocated");
      setAllocateOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Could not allocate"));
    }
  }

  async function handleTransfer() {
    if (!transferMembershipId) return;
    if (!transferTargetBed && !transferTargetSpace) {
      toast.error("Select a bed or unit as the transfer target first");
      return;
    }
    try {
      await mutations.transfer.mutateAsync({
        membershipId: transferMembershipId,
        targetBedId: transferTargetBed?.id,
        targetUnitSpaceId: transferTargetSpace && !transferTargetBed ? transferTargetSpace.id : undefined,
        transferDate,
      });
      toast.success("Transferred");
      setTransferOpen(false);
      setTransferTargetBed(null);
      setTransferTargetSpace(null);
    } catch (error) {
      toast.error(errorMessage(error, "Could not transfer"));
    }
  }

  async function handleRelease() {
    if (!releaseOccupancyId) return;
    try {
      await mutations.release.mutateAsync({
        occupancyId: releaseOccupancyId,
        moveOutDate,
      });
      toast.success("Released");
      setReleaseOpen(false);
      setReleaseOccupancyId("");
      setReleaseResidentName("");
      setReleaseTargetLabel("");
    } catch (error) {
      toast.error(errorMessage(error, "Could not release"));
    }
  }

  const transferTargetLabel = transferTargetBed
    ? `Bed ${transferTargetBed.bedLabel}`
  : transferTargetSpace
      ? transferTargetSpace.displayName ?? transferTargetSpace.identifier
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openAllocate()}>Allocate resident</Button>
        <Button variant="outline" onClick={openTransferDialog}>
          Transfer
        </Button>
        <Button variant="outline" onClick={() => setReleaseOpen(true)}>
          Release
        </Button>
      </div>

      {transferOpen && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          Transfer mode: click an available {viz?.accommodationMode === "BED_BASED" ? "bed" : "unit"} below to set the destination.
          {transferTargetLabel ? ` Selected: ${transferTargetLabel}.` : ""}
        </p>
      )}

      {currentOccupancies.length > 0 && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-2 text-sm font-semibold">Current occupancies</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {currentOccupancies.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{o.residentName}</span>
                <span className="flex items-center gap-2">
                  <span>{o.bedLabel ?? o.unitIdentifier ?? "—"}</span>
                  {viz?.accommodationMode === "BED_BASED" && o.monthlyRent != null && (
                    <span className="text-xs text-muted-foreground">₹{o.monthlyRent}/mo</span>
                  )}
                  {viz?.accommodationMode === "BED_BASED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditRentOccupancyId(o.id);
                        setEditRentResidentName(o.residentName);
                        setEditRentTargetLabel(o.bedLabel ?? o.unitIdentifier ?? "—");
                        setEditRentAmount(String(o.monthlyRent ?? ""));
                        setEditRentOpen(true);
                      }}
                    >
                      Edit rent
                    </Button>
                  )}
                </span>
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
            transferSelectMode={transferOpen}
            onSelectBed={handleBedSelect}
            onSelectSpace={handleSpaceSelect}
            onReleaseBed={openReleaseForBed}
            onReleaseSpace={openReleaseForSpace}
            onEditRentBed={viz.accommodationMode === "BED_BASED" ? openEditRentForBed : undefined}
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
                {unallocatedResidents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.userFullName}
                  </option>
                ))}
              </select>
              {unallocatedResidents.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All residents already have a bed or unit. Use transfer to move someone.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Move-in date</Label>
              <Input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
            {viz?.accommodationMode === "UNIT_BASED" && (
              <div className="space-y-1">
                <Label>Occupancy type</Label>
                <select
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={occupancyClassification}
                  onChange={(e) =>
                    setOccupancyClassification(
                      e.target.value as "RESIDENT" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED",
                    )
                  }
                >
                  <option value="TENANT_OCCUPIED">Tenant occupied</option>
                  <option value="OWNER_OCCUPIED">Owner occupied</option>
                  <option value="RESIDENT">Resident</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Used for maintenance billing responsibility when no ownership record exists.
                </p>
              </div>
            )}
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

      <Dialog
        open={transferOpen}
        onOpenChange={(open) => {
          setTransferOpen(open);
          if (!open) {
            setTransferTargetBed(null);
            setTransferTargetSpace(null);
          }
        }}
      >
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
                {currentOccupancies.map((o) => (
                  <option key={o.membershipId} value={o.membershipId}>
                    {o.residentName} — {o.bedLabel ?? o.unitIdentifier ?? "—"}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Select an available {viz?.accommodationMode === "BED_BASED" ? "bed" : "unit"} in the structure list as the transfer target.
            </p>
            {transferTargetLabel && (
              <p className="text-sm font-medium">Transfer target: {transferTargetLabel}</p>
            )}
            <div className="space-y-1">
              <Label>Transfer date</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                mutations.transfer.isPending ||
                !transferMembershipId ||
                (!transferTargetBed && !transferTargetSpace)
              }
              onClick={() => void handleTransfer()}
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={releaseOpen}
        onOpenChange={(open) => {
          setReleaseOpen(open);
          if (!open) {
            setReleaseOccupancyId("");
            setReleaseResidentName("");
            setReleaseTargetLabel("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release occupancy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {releaseResidentName ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{releaseResidentName}</p>
                {releaseTargetLabel ? (
                  <p className="text-muted-foreground">Currently at {releaseTargetLabel}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-1">
              <Label>Occupancy</Label>
              <select
                className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={releaseOccupancyId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setReleaseOccupancyId(nextId);
                  const selected = currentOccupancies.find((o) => o.id === nextId);
                  if (selected) {
                    setReleaseResidentName(selected.residentName);
                    setReleaseTargetLabel(selected.bedLabel ?? selected.unitIdentifier ?? "");
                  }
                }}
              >
                <option value="">Select…</option>
                {currentOccupancies.map((o) => (
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
            <Button
              disabled={mutations.release.isPending || !releaseOccupancyId}
              onClick={() => void handleRelease()}
            >
              Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editRentOpen}
        onOpenChange={(open) => {
          setEditRentOpen(open);
          if (!open) {
            setEditRentOccupancyId("");
            setEditRentResidentName("");
            setEditRentTargetLabel("");
            setEditRentAmount("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update monthly rent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{editRentResidentName}</p>
              {editRentTargetLabel ? (
                <p className="text-muted-foreground">{editRentTargetLabel}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>Monthly rent (₹)</Label>
              <Input
                type="number"
                min={1}
                value={editRentAmount}
                onChange={(e) => setEditRentAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Future rent charges use this amount. Existing pending charges are unchanged.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRentOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={mutations.updateRent.isPending || !editRentOccupancyId}
              onClick={() => void handleUpdateRent()}
            >
              Save rent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
