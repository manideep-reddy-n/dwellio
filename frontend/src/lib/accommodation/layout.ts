export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VizLayout {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

const BUILDING_DEFAULTS = { width: 220, height: 180, gap: 24 };
const FLOOR_DEFAULTS = { width: 200, height: 160, gap: 20 };
const SPACE_DEFAULTS = { width: 130, height: 110, gap: 16 };

export function resolveLayout(
  layout: VizLayout | null | undefined,
  index: number,
  kind: "building" | "floor" | "space",
): LayoutRect {
  if (layout?.x != null && layout?.y != null && layout?.width != null && layout?.height != null) {
    return { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
  }

  const cols = kind === "building" ? 3 : kind === "floor" ? 2 : 4;
  const defaults =
    kind === "building" ? BUILDING_DEFAULTS : kind === "floor" ? FLOOR_DEFAULTS : SPACE_DEFAULTS;
  const col = index % cols;
  const row = Math.floor(index / cols);

  return {
    x: 24 + col * (defaults.width + defaults.gap),
    y: (kind === "building" ? 52 : 24) + row * (defaults.height + defaults.gap),
    width: defaults.width,
    height: defaults.height,
  };
}

export function canvasSize(items: LayoutRect[], minWidth = 800, minHeight = 520): { width: number; height: number } {
  if (items.length === 0) return { width: minWidth, height: minHeight };
  const maxX = Math.max(...items.map((i) => i.x + i.width));
  const maxY = Math.max(...items.map((i) => i.y + i.height));
  return {
    width: Math.max(minWidth, maxX + 48),
    height: Math.max(minHeight, maxY + 48),
  };
}
