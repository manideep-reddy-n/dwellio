"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useAnnouncementMutations } from "@/hooks/use-ops-announcements";
import { announcementTypeLabels } from "@/lib/resident/labels";
import { formatRelativeTime } from "@/lib/format/datetime";
import type { Announcement } from "@/types/api/announcement";
import type { AnnouncementType } from "@/types/enums";
import { toast } from "sonner";

const announcementTypes = Object.keys(announcementTypeLabels) as AnnouncementType[];

interface AnnouncementManagerProps {
  orgId: string;
  announcements: Announcement[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function AnnouncementManager({
  orgId,
  announcements,
  isLoading,
  isError,
  onRetry,
}: AnnouncementManagerProps) {
  const { create, publish, remove } = useAnnouncementMutations(orgId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnouncementType>("GENERAL");

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      await create.mutateAsync({ title: title.trim(), content: content.trim(), type });
      toast.success("Draft created");
      setOpen(false);
      setTitle("");
      setContent("");
      setType("GENERAL");
    } catch {
      toast.error("Could not create announcement");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="size-4" />
            New announcement
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ann-title">Title</Label>
                <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ann-type">Type</Label>
                <select
                  id="ann-type"
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as AnnouncementType)}
                >
                  {announcementTypes.map((t) => (
                    <option key={t} value={t}>
                      {announcementTypeLabels[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ann-content">Content</Label>
                <Textarea
                  id="ann-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={create.isPending} onClick={() => void handleCreate()}>
                Save draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!announcements?.length ? (
        <EmptyState
          title="No announcements"
          description="Create and publish updates for your residents."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 size-4 text-teal-600" />
                  <div>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {announcementTypeLabels[a.type]} ·{" "}
                      {formatRelativeTime(a.publishedAt ?? a.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={a.published ? "default" : "secondary"}>
                  {a.published ? "Published" : "Draft"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                <div className="flex gap-2">
                  {!a.published && (
                    <Button
                      size="sm"
                      disabled={publish.isPending}
                      onClick={() => publish.mutate(a.id)}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
