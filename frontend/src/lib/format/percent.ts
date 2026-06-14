/** Backend sends rates as 0–100 (percent), not 0–1 fractions. */
export function formatPercent(value: number | null | undefined, decimals = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  const clamped = Math.min(100, Math.max(0, value));
  return `${clamped.toFixed(decimals)}%`;
}

export function percentForChart(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
