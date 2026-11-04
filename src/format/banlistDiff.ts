import type { BanlistSnapshotCard } from './banlistSnapshotSchema.ts';

export type BanlistSnapshotCardStatus = BanlistSnapshotCard['status'];

/** Master Duel copy cap encoded in change badges (0 / 1 / 2). */
export function banlistStatusCopyLimit(
  status: BanlistSnapshotCardStatus | null | undefined,
): 0 | 1 | 2 | 3 {
  switch (status) {
    case 'forbidden':
      return 0;
    case 'limited':
      return 1;
    case 'semi-limited':
      return 2;
    default:
      return 3;
  }
}

export type BanlistChangeBadge = 'New!' | `From ${0 | 1 | 2}`;

export function banlistChangeBadge(
  previousStatus: BanlistSnapshotCardStatus | undefined,
  currentStatus: BanlistSnapshotCardStatus,
): BanlistChangeBadge | null {
  if (previousStatus === undefined) {
    return 'New!';
  }
  const previousLimit = banlistStatusCopyLimit(previousStatus);
  const currentLimit = banlistStatusCopyLimit(currentStatus);
  if (previousLimit === currentLimit) {
    return null;
  }
  if (previousLimit === 3) {
    return 'New!';
  }
  return `From ${previousLimit}` as BanlistChangeBadge;
}

export type BanlistDiffResult = {
  readonly badgesByCardId: ReadonlyMap<number, BanlistChangeBadge>;
  readonly noLongerRestricted: readonly BanlistSnapshotCard[];
};

function indexSnapshotCards(
  cards: readonly BanlistSnapshotCard[],
): ReadonlyMap<number, BanlistSnapshotCard> {
  const byId = new Map<number, BanlistSnapshotCard>();
  for (const card of cards) {
    byId.set(card.id, card);
  }
  return byId;
}

/**
 * Compares the current curated list to an optional previous snapshot in the same lineage.
 * When `previousCards` is omitted, returns empty diff (no badges, no removals).
 */
export function computeBanlistDiff(
  currentCards: readonly BanlistSnapshotCard[],
  previousCards: readonly BanlistSnapshotCard[] | undefined,
): BanlistDiffResult {
  if (!previousCards || previousCards.length === 0) {
    return { badgesByCardId: new Map(), noLongerRestricted: [] };
  }

  const previousById = indexSnapshotCards(previousCards);
  const currentById = indexSnapshotCards(currentCards);
  const badgesByCardId = new Map<number, BanlistChangeBadge>();

  for (const card of currentCards) {
    const badge = banlistChangeBadge(previousById.get(card.id)?.status, card.status);
    if (badge) {
      badgesByCardId.set(card.id, badge);
    }
  }

  const noLongerRestricted: BanlistSnapshotCard[] = [];
  for (const card of previousCards) {
    if (!currentById.has(card.id)) {
      noLongerRestricted.push(card);
    }
  }
  noLongerRestricted.sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  );

  return { badgesByCardId, noLongerRestricted };
}
