import {
  tcgBanlistSnapshotSchema,
  type BanlistSnapshotCard,
  type TcgBanlistSnapshot,
} from './banlistSnapshotSchema.ts';
import { getPreviousTcgBanlistEffectiveDate } from './tcgBanlistManifest.ts';

const snapshotLoaders = import.meta.glob('./data/tcg/lists/*.json') as Record<
  string,
  () => Promise<{ default: unknown }>
>;

function loaderKey(effectiveDate: string): string {
  return `./data/tcg/lists/${effectiveDate}.json`;
}

export async function loadTcgBanlistSnapshot(
  effectiveDate: string,
): Promise<TcgBanlistSnapshot | undefined> {
  const load = snapshotLoaders[loaderKey(effectiveDate)];
  if (!load) return undefined;
  const module = await load();
  return tcgBanlistSnapshotSchema.parse(module.default);
}

export async function loadTcgBanlistSnapshotWithPrevious(effectiveDate: string): Promise<{
  snapshot: TcgBanlistSnapshot;
  previousCards: readonly BanlistSnapshotCard[] | undefined;
} | null> {
  const snapshot = await loadTcgBanlistSnapshot(effectiveDate);
  if (!snapshot) return null;
  const previousDate = getPreviousTcgBanlistEffectiveDate(effectiveDate);
  if (!previousDate) {
    return { snapshot, previousCards: undefined };
  }
  const previous = await loadTcgBanlistSnapshot(previousDate);
  return { snapshot, previousCards: previous?.cards };
}
