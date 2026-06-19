"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComplaint } from "@/hooks/use-complaints";
import { useOrgStore } from "@/stores/org-store";
import {
  complaintCategoryLabels,
  complaintPriorities,
  complaintPriorityLabels,
} from "@/lib/resident/labels";
import {
  complaintCategoriesForOrgType,
  defaultComplaintCategory,
} from "@/lib/complaints/categories";
import type { ComplaintCategory, ComplaintPriority } from "@/types/enums";
import { toast } from "sonner";

interface ComplaintCreateDialogProps {
  orgId: string;
}

export function ComplaintCreateDialog({ orgId }: ComplaintCreateDialogProps) {
  const orgType = useOrgStore((s) => s.activeOrg?.type);
  const categories = complaintCategoriesForOrgType(orgType);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>(defaultComplaintCategory(orgType));
  const [priority, setPriority] = useState<ComplaintPriority>("MEDIUM");

  const create = useCreateComplaint(orgId);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(defaultComplaintCategory(orgType));
    }
  }, [categories, category, orgType]);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory(defaultComplaintCategory(orgType));
    setPriority("MEDIUM");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      toast.success("Complaint submitted");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit complaint");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New complaint
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              Describe the problem and we will notify the operations team.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-title">Title</Label>
              <Input
                id="complaint-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary"
                maxLength={255}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="complaint-category">Category</Label>
                <select
                  id="complaint-category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {complaintCategoryLabels[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaint-priority">Priority</Label>
                <select
                  id="complaint-priority"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                >
                  {complaintPriorities.map((p) => (
                    <option key={p} value={p}>
                      {complaintPriorityLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaint-description">Description</Label>
              <Textarea
                id="complaint-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Include location and timing if relevant."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
