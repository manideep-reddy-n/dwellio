"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutRect } from "@/lib/accommodation/layout";
import { cn } from "@/lib/utils";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface DraggableResizableProps {
  rect: LayoutRect;
  editing: boolean;
  active?: boolean;
  zoom?: number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  onChange: (rect: LayoutRect) => void;
  children: React.ReactNode;
}

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function DraggableResizable({
  rect,
  editing,
  active = true,
  zoom = 1,
  minWidth = 60,
  minHeight = 48,
  className,
  onChange,
  children,
}: DraggableResizableProps) {
  const [local, setLocal] = useState(rect);
  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => {
    setLocal(rect);
  }, [rect.x, rect.y, rect.width, rect.height]);

  const interaction = useRef<
    | { kind: "drag"; startX: number; startY: number; origin: LayoutRect }
    | { kind: "resize"; handle: ResizeHandle; startX: number; startY: number; origin: LayoutRect }
    | null
  >(null);

  const commit = useCallback(
    (next: LayoutRect) => {
      setLocal(next);
      onChange(next);
    },
    [onChange],
  );

  function onDragStart(e: React.PointerEvent) {
    if (!editing || !active) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    interaction.current = {
      kind: "drag",
      startX: e.clientX,
      startY: e.clientY,
      origin: localRef.current,
    };
  }

  function onResizeStart(handle: ResizeHandle, e: React.PointerEvent) {
    if (!editing || !active) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    interaction.current = {
      kind: "resize",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origin: localRef.current,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const active = interaction.current;
    if (!active) return;
    const dx = (e.clientX - active.startX) / zoom;
    const dy = (e.clientY - active.startY) / zoom;

    if (active.kind === "drag") {
      commit({
        ...active.origin,
        x: Math.max(0, active.origin.x + dx),
        y: Math.max(0, active.origin.y + dy),
      });
      return;
    }

    const o = active.origin;
    let { x, y, width, height } = o;
    const handle = active.handle;

    if (handle.includes("e")) width = Math.max(minWidth, o.width + dx);
    if (handle.includes("s")) height = Math.max(minHeight, o.height + dy);
    if (handle.includes("w")) {
      width = Math.max(minWidth, o.width - dx);
      x = o.x + (o.width - width);
    }
    if (handle.includes("n")) {
      height = Math.max(minHeight, o.height - dy);
      y = o.y + (o.height - height);
    }

    commit({ x: Math.max(0, x), y: Math.max(0, y), width, height });
  }

  function onPointerUp() {
    interaction.current = null;
  }

  const showHandles = editing && active;

  return (
    <div
      className={cn(
        "absolute",
        className,
        editing && active && "z-10 ring-2 ring-primary/40 ring-offset-1",
      )}
      style={{ left: local.x, top: local.y, width: local.width, height: local.height }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {showHandles && (
        <button
          type="button"
          className="absolute -left-1 -top-1 z-20 size-4 cursor-grab rounded-full border bg-background shadow active:cursor-grabbing"
          onPointerDown={onDragStart}
          aria-label="Move"
        />
      )}
      {children}
      {showHandles &&
        HANDLES.map((handle) => (
          <button
            key={handle}
            type="button"
            className={cn(
              "absolute z-20 size-2.5 rounded-sm border bg-primary/80",
              handle === "n" && "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize",
              handle === "s" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize",
              handle === "e" && "right-0 top-1/2 -translate-y-1/2 translate-x-1/2 cursor-e-resize",
              handle === "w" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize",
              handle === "ne" && "right-0 top-0 -translate-y-1/2 translate-x-1/2 cursor-ne-resize",
              handle === "nw" && "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize",
              handle === "se" && "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize",
              handle === "sw" && "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize",
            )}
            onPointerDown={(e) => onResizeStart(handle, e)}
            aria-label={`Resize ${handle}`}
          />
        ))}
    </div>
  );
}
