import type { BanDisplayStatus } from '../catalog/formatBanContext.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { computeBanlistDiff, type BanlistChangeBadge } from './banlistDiff.ts';
import {
  getFormatBanlistPreviousList,
  getFormatBanlistSnapshot,
  isBanlistSnapshotFormatId,
  snapshotCardToBanStatus,
} from './banlistSnapshots.ts';
import { resolveBanlistDisplayCard } from './banlistDisplayCard.ts';
import type { BanlistSnapshotCard } from './banlistSnapshotSchema.ts';
import type { FormatDefinition } from './formatCatalog.ts';
import { resolveFormatBanStatus } from './formatBanStatus.ts';
import {
  buildGenesysPlaceholderCard,
  isGenesysPlaceholderCardId,
} from './genesysPlaceholderCard.ts';
import { listKonamiGenesysPointEntries, normalizeGenesysCardName } from './genesysKonamiPoints.ts';
import { isCardInFormatPool } from './formatPool.ts';

<<<<<<< HEAD
export type BanlistSectionId =
  'forbidden' | 'limited' | 'semi-limited' | 'no-longer-restricted' | `genesys-points-${number}`;
=======
export type BanlistSectionId = 'forbidden' | 'limited' | 'semi-limited' | 'no-longer-restricted';

export type BanlistSectionHeading =
  | 'Forbidden'
  | 'Limited'
  | 'Semi-Limited'
  | 'No Longer Restricted'
  | 'New to Forbidden'
  | 'New to Limited'
  | 'New to Semi-Limited';
>>>>>>> 7bb700c2 (Add TCG banlists history pages and dated snapshots)

export type FormatBanlistCardEntry = {
  readonly card: YugiohCard;
  readonly banStatus: BanDisplayStatus | null;
  readonly changeBadge: BanlistChangeBadge | null;
  readonly genesysPoints?: number;
};

export type FormatBanlistSection = {
  readonly id: BanlistSectionId;
  readonly heading: string;
  readonly cards: readonly FormatBanlistCardEntry[];
};

export type FormatBanlistPageModel = {
  readonly effectiveDate: string | null;
  readonly sections: readonly FormatBanlistSection[];
  /** Pool cards as name tiles when restricted sections are empty. */
  readonly poolPreview?: {
    readonly heading: string;
    readonly cards: readonly FormatBanlistCardEntry[];
  };
};

export type TcgBanlistDetailPageModel = {
  readonly effectiveDate: string;
  readonly listName: string;
  readonly changeSections: readonly FormatBanlistSection[];
  readonly fullSections: readonly FormatBanlistSection[];
};

const RESTRICTED_SECTIONS: readonly {
  id: BanlistSectionId;
  heading: string;
  status: BanlistSnapshotCard['status'];
}[] = [
  { id: 'forbidden', heading: 'Forbidden', status: 'forbidden' },
  { id: 'limited', heading: 'Limited', status: 'limited' },
  { id: 'semi-limited', heading: 'Semi-Limited', status: 'semi-limited' },
];

function catalogById(cards: readonly YugiohCard[]): ReadonlyMap<number, YugiohCard> {
  return new Map(cards.map((card) => [card.id, card]));
}

function catalogByNormalizedName(cards: readonly YugiohCard[]): ReadonlyMap<string, YugiohCard> {
  const byName = new Map<string, YugiohCard>();
  for (const card of cards) {
    const key = normalizeGenesysCardName(card.name);
    if (!byName.has(key)) {
      byName.set(key, card);
    }
  }
  return byName;
}

function sortByName(entries: FormatBanlistCardEntry[]): FormatBanlistCardEntry[] {
  return [...entries].sort((left, right) =>
    left.card.name.localeCompare(right.card.name, undefined, { sensitivity: 'base' }),
  );
}

function buildSectionsFromSnapshotRows(
  snapshotCards: readonly BanlistSnapshotCard[],
  previousCards: readonly BanlistSnapshotCard[] | undefined,
  catalogCards: readonly YugiohCard[],
  options: { includeBadges: boolean },
): FormatBanlistSection[] {
  const diff = computeBanlistDiff(snapshotCards, previousCards);
  const byId = catalogById(catalogCards);
  const sections: FormatBanlistSection[] = [];

  for (const section of RESTRICTED_SECTIONS) {
    const entries: FormatBanlistCardEntry[] = [];
    for (const row of snapshotCards) {
      if (row.status !== section.status) continue;
      const card = resolveBanlistDisplayCard(row, byId);
      entries.push({
        card,
        banStatus: snapshotCardToBanStatus(row.status),
        changeBadge: options.includeBadges ? (diff.badgesByCardId.get(row.id) ?? null) : null,
      });
    }
    sections.push({
      id: section.id,
      heading: section.heading,
      cards: sortByName(entries),
    });
  }

  if (previousCards && diff.noLongerRestricted.length > 0) {
    const removedEntries: FormatBanlistCardEntry[] = [];
    for (const row of diff.noLongerRestricted) {
      const card = resolveBanlistDisplayCard(row, byId);
      removedEntries.push({
        card,
        banStatus: null,
        changeBadge: null,
      });
    }
    sections.push({
      id: 'no-longer-restricted',
      heading: 'No Longer Restricted',
      cards: sortByName(removedEntries),
    });
  }

  return sections;
}

function buildSnapshotSections(
  format: FormatDefinition,
  catalogCards: readonly YugiohCard[],
): FormatBanlistPageModel {
  const formatId = format.id;
  if (!isBanlistSnapshotFormatId(formatId)) {
    return { effectiveDate: null, sections: [] };
  }

  const snapshot = getFormatBanlistSnapshot(formatId);
  const previous = getFormatBanlistPreviousList(formatId);
  const sections = buildSectionsFromSnapshotRows(snapshot.cards, previous?.cards, catalogCards, {
    includeBadges: true,
  });

  return {
    effectiveDate: snapshot.effectiveDate,
    sections,
  };
}

<<<<<<< HEAD
function buildGenesysPointSections(
  _format: FormatDefinition,
  catalogCards: readonly YugiohCard[],
): FormatBanlistPageModel {
  const byName = catalogByNormalizedName(catalogCards);
  const grouped = new Map<number, FormatBanlistCardEntry[]>();

  for (const row of listKonamiGenesysPointEntries()) {
    const key = normalizeGenesysCardName(row.name);
    const catalogCard = byName.get(key);
    const card = catalogCard ?? buildGenesysPlaceholderCard(row.name, row.points);
    const bucket = grouped.get(row.points) ?? [];
    bucket.push({
      card,
      banStatus: null,
      changeBadge: null,
      genesysPoints: row.points,
    });
    grouped.set(row.points, bucket);
  }

  const pointValues = [...grouped.keys()].sort((left, right) => right - left);
  const sections: FormatBanlistSection[] = pointValues.map((points) => ({
    id: `genesys-points-${points}`,
    heading: `${points} points`,
    cards: sortByName(grouped.get(points) ?? []),
  }));

  return {
    effectiveDate: null,
    sections,
  };
}

function banlistSectionsHaveCards(sections: readonly FormatBanlistSection[]): boolean {
  return sections.some((section) => section.cards.length > 0);
}

function buildSpeedDuelPoolPreview(
  formatId: FormatDefinition['id'],
  catalogCards: readonly YugiohCard[],
): FormatBanlistPageModel['poolPreview'] {
  const entries: FormatBanlistCardEntry[] = [];
  for (const card of catalogCards) {
    if (!isCardInFormatPool(card, formatId)) continue;
    entries.push({ card, banStatus: null, changeBadge: null });
  }
  if (entries.length === 0) return undefined;
  return {
    heading: 'Speed Duel pool',
    cards: sortByName(entries),
=======
export function buildTcgBanlistDetailPageModel(
  snapshot: {
    effectiveDate: string;
    listName: string;
    cards: readonly BanlistSnapshotCard[];
  },
  previousCards: readonly BanlistSnapshotCard[] | undefined,
  catalogCards: readonly YugiohCard[],
): TcgBanlistDetailPageModel {
  const withBadges = buildSectionsFromSnapshotRows(snapshot.cards, previousCards, catalogCards, {
    includeBadges: true,
  });
  const fullOnly = buildSectionsFromSnapshotRows(snapshot.cards, previousCards, catalogCards, {
    includeBadges: false,
  }).filter((section) => section.id !== 'no-longer-restricted');

  const changeHeadingById: Record<
    Exclude<BanlistSectionId, 'no-longer-restricted'>,
    BanlistSectionHeading
  > = {
    forbidden: 'New to Forbidden',
    limited: 'New to Limited',
    'semi-limited': 'New to Semi-Limited',
  };

  const changeSections: FormatBanlistSection[] = [];
  for (const section of withBadges) {
    if (section.id === 'no-longer-restricted') {
      if (section.cards.length > 0) changeSections.push(section);
      continue;
    }
    const changedCards = section.cards.filter((entry) => entry.changeBadge !== null);
    if (changedCards.length === 0) continue;
    changeSections.push({
      id: section.id,
      heading: changeHeadingById[section.id],
      cards: changedCards,
    });
  }

  return {
    effectiveDate: snapshot.effectiveDate,
    listName: snapshot.listName,
    changeSections,
    fullSections: fullOnly,
>>>>>>> 7bb700c2 (Add TCG banlists history pages and dated snapshots)
  };
}

function buildTcgCurrentSections(
  format: FormatDefinition,
  catalogCards: readonly YugiohCard[],
): FormatBanlistPageModel {
  const formatId = format.id;
  const grouped: Record<BanDisplayStatus, FormatBanlistCardEntry[]> = {
    Forbidden: [],
    Limited: [],
    'Semi-Limited': [],
  };

  for (const card of catalogCards) {
    if (!isCardInFormatPool(card, formatId)) continue;
    const banStatus = resolveFormatBanStatus(card, formatId);
    if (!banStatus) continue;
    grouped[banStatus].push({ card, banStatus, changeBadge: null });
  }

  const sections: FormatBanlistSection[] = RESTRICTED_SECTIONS.map((section) => ({
    id: section.id,
    heading: section.heading,
    cards: sortByName(grouped[section.heading as BanDisplayStatus]),
  }));

  return {
    effectiveDate: format.sortDate ?? null,
    sections,
  };
}

export function buildFormatBanlistPageModel(
  format: FormatDefinition,
  catalogCards: readonly YugiohCard[],
): FormatBanlistPageModel {
  if (format.banlistSource === 'genesys-points') {
    return buildGenesysPointSections(format, catalogCards);
  }
  if (format.banlistSource === 'curated-snapshot') {
    return buildSnapshotSections(format, catalogCards);
  }
  const model = buildTcgCurrentSections(format, catalogCards);
  if (format.id === 'speed-duel' && !banlistSectionsHaveCards(model.sections)) {
    const poolPreview = buildSpeedDuelPoolPreview(format.id, catalogCards);
    if (poolPreview) {
      return { ...model, poolPreview };
    }
  }
  return model;
}

export { isGenesysPlaceholderCardId };
