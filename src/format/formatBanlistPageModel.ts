import type { BanDisplayStatus } from '../catalog/formatBanContext.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { computeBanlistDiff, type BanlistChangeBadge } from './banlistDiff.ts';
import {
  getFormatBanlistPreviousList,
  getFormatBanlistSnapshot,
  isBanlistSnapshotFormatId,
  snapshotCardToBanStatus,
} from './banlistSnapshots.ts';
import type { BanlistSnapshotCard } from './banlistSnapshotSchema.ts';
import type { FormatDefinition } from './formatCatalog.ts';
import { resolveFormatBanStatus } from './formatBanStatus.ts';
import {
  buildGenesysPlaceholderCard,
  isGenesysPlaceholderCardId,
} from './genesysPlaceholderCard.ts';
import { listKonamiGenesysPointEntries, normalizeGenesysCardName } from './genesysKonamiPoints.ts';

export type BanlistSectionId =
  'forbidden' | 'limited' | 'semi-limited' | 'no-longer-restricted' | `genesys-points-${number}`;

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
  const diff = computeBanlistDiff(snapshot.cards, previous?.cards);
  const byId = catalogById(catalogCards);

  const sections: FormatBanlistSection[] = [];

  for (const section of RESTRICTED_SECTIONS) {
    const entries: FormatBanlistCardEntry[] = [];
    for (const row of snapshot.cards) {
      if (row.status !== section.status) continue;
      const card = byId.get(row.id);
      if (!card) continue;
      entries.push({
        card,
        banStatus: snapshotCardToBanStatus(row.status),
        changeBadge: diff.badgesByCardId.get(row.id) ?? null,
      });
    }
    sections.push({
      id: section.id,
      heading: section.heading,
      cards: sortByName(entries),
    });
  }

  if (previous?.cards && diff.noLongerRestricted.length > 0) {
    const removedEntries: FormatBanlistCardEntry[] = [];
    for (const row of diff.noLongerRestricted) {
      const card = byId.get(row.id);
      if (!card) continue;
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

  return {
    effectiveDate: snapshot.effectiveDate,
    sections,
  };
}

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
  return buildTcgCurrentSections(format, catalogCards);
}

export { isGenesysPlaceholderCardId };
