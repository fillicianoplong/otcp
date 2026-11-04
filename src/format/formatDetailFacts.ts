import {
  getFormatBanlistSnapshot,
  isBanlistSnapshotFormatId,
  type BanlistSnapshotFormatId,
} from './banlistSnapshots.ts';
import type { FormatDefinition } from './formatCatalog.ts';

export type FormatSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type FormatDetailBanList = {
  readonly effectiveDate: string;
  readonly listName: string;
};

export type FormatDetailCardPool = {
  readonly cardsReleasedBy: string;
  readonly latestSet: string;
  readonly notIncluded?: string;
};

export type FormatDetailFacts = {
  readonly description: string | null;
  readonly banList: FormatDetailBanList | null;
  readonly cardPool: FormatDetailCardPool | null;
  readonly sourceLinks: readonly FormatSourceLink[];
};

/** Catalog exclusion notes use an "Excludes …" prefix; the grid shows the set name only. */
export function poolNotIncludedFromExclusionNote(
  exclusionNote: string | undefined,
): string | undefined {
  if (!exclusionNote) return undefined;
  const trimmed = exclusionNote.trim();
  const withoutPrefix = trimmed.replace(/^Excludes\s+/i, '');
  return withoutPrefix.length > 0 ? withoutPrefix : undefined;
}

function linkFromSortDateSource(sortDateSource: string | undefined): FormatSourceLink | null {
  if (!sortDateSource) return null;
  const match = /\((https:\/\/[^)]+)\)\s*$/.exec(sortDateSource);
  if (!match) return null;
  return { label: 'Konami TCG Forbidden & Limited List', href: match[1] };
}

function snapshotSourceLinks(formatId: BanlistSnapshotFormatId): FormatSourceLink[] {
  const snapshot = getFormatBanlistSnapshot(formatId);
  return [
    { label: snapshot.source.name, href: snapshot.source.url },
    { label: 'Ban list reference', href: snapshot.snapshotSourceUrl },
  ];
}

function mergeSourceLinks(
  base: readonly FormatSourceLink[],
  extra: readonly FormatSourceLink[] | undefined,
): FormatSourceLink[] {
  const seen = new Set<string>();
  const merged: FormatSourceLink[] = [];
  for (const link of [...base, ...(extra ?? [])]) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    merged.push(link);
  }
  return merged;
}

function buildBanList(format: FormatDefinition): FormatDetailBanList | null {
  const effectiveDate = format.sortDate;
  if (!effectiveDate) return null;

  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    const snapshot = getFormatBanlistSnapshot(format.id);
    return {
      effectiveDate: snapshot.effectiveDate,
      listName: snapshot.listName,
    };
  }

  return {
    effectiveDate,
    listName: format.banlistHeading,
  };
}

function buildCardPool(format: FormatDefinition): FormatDetailCardPool | null {
  if (format.poolRule !== 'tcg-earliest-on-or-before') return null;
  if (!format.poolThroughSet || !format.poolCutoffDate) return null;

  const notIncluded = poolNotIncludedFromExclusionNote(format.poolExclusionNote);

  return {
    cardsReleasedBy: format.poolCutoffDate,
    latestSet: format.poolThroughSet,
    notIncluded,
  };
}

/** Built from catalog entries and curated snapshot JSON only. */
export function buildFormatDetailFacts(format: FormatDefinition): FormatDetailFacts {
  let sourceLinks: FormatSourceLink[] = [];
  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    sourceLinks = snapshotSourceLinks(format.id);
  } else {
    const tcgLink = linkFromSortDateSource(format.sortDateSource);
    if (tcgLink) {
      sourceLinks = [tcgLink];
    }
  }

  const description = format.description?.trim();
  sourceLinks = mergeSourceLinks(sourceLinks, format.detailSourceLinks);

  return {
    description: description ? description : null,
    banList: buildBanList(format),
    cardPool: buildCardPool(format),
    sourceLinks,
  };
}
