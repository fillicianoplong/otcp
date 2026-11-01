import type { YgoprodeckDropCounts } from './mapYgoprodeck.ts';

export function logYgoprodeckDropCounts(dropped: YgoprodeckDropCounts): void {
  if (dropped.unsupported > 0) {
    console.log(
      `DataPipeline: dropped ${dropped.unsupported} row(s) outside v1 Yu-Gi-Oh! scope (e.g. Rush Duel)`,
    );
  }
  if (dropped.placeholder > 0) {
    console.log(
      `DataPipeline: dropped ${dropped.placeholder} placeholder row(s) (denylist or placeholder profile text)`,
    );
  }
}
