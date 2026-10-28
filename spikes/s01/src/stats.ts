export type Summary = {
  n: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
};

/** Nearest-rank percentile. `p95` is the smallest sample at or above the 95th rank. */
export function summarize(samples: readonly number[]): Summary {
  if (samples.length === 0) return { n: 0, min: 0, p50: 0, p95: 0, max: 0 };
  const sorted = samples.slice().sort((a, b) => a - b);
  return {
    n: sorted.length,
    min: sorted[0],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
  };
}

function percentile(sorted: readonly number[], p: number): number {
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[index];
}
