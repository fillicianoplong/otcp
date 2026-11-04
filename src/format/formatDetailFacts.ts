import { FORMAT_TCG_BANLIST_DATES, tcgBanlistDetailPath } from './tcgBanlistManifest.ts';
import type { FormatDefinition, FormatId } from './formatCatalog.ts';
import {
  getFormatBanlistSnapshot,
  isBanlistSnapshotFormatId,
  type BanlistSnapshotFormatId,
} from './banlistSnapshots.ts';
import { DEFAULT_GENESYS_POINT_CAP } from './formatEngine/genesysRules.ts';
import { getGenesysKonamiPointsDocument } from './genesysKonamiPoints.ts';

const KONAMI_SPEED_DUEL_GUIDE_URL =
  'https://img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf';

const KONAMI_SPEED_DUEL_FNL_PAGE_URL =
  'https://www.yugioh-card.com/eu/play/speed-duel-forbidden-limited-list/';

const SPEED_DUEL_DETAIL_INTRO =
  'Konami launched Speed Duel for the physical TCG in January 2019 with Speed Duel Starter Decks: Destiny Masters and Duelists of Tomorrow (North America launch 25 January 2019), adapting the faster Yu-Gi-Oh! Duel Links style of play for tabletop Duels.';

export type FormatSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type FormatDetailBanList = {
  readonly effectiveDate?: string;
  readonly listName: string;
  readonly historyPath?: string;
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
  readonly genesysDetail: FormatDetailGenesysFacts | null;
  readonly sourceLinks: readonly FormatSourceLink[];
};

export type FormatDetailGenesysFacts = {
  readonly banListName: string;
  readonly pointCap: number;
  readonly notIncluded: string;
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

function historyPathForFormat(formatId: FormatId): string | undefined {
  const dated = FORMAT_TCG_BANLIST_DATES[formatId as keyof typeof FORMAT_TCG_BANLIST_DATES];
  return dated ? tcgBanlistDetailPath(dated) : undefined;
}

function buildBanList(format: FormatDefinition): FormatDetailBanList | null {
  if (format.banlistSource === 'genesys-points') {
    return null;
  }

  const effectiveDate = format.sortDate;
  if (!effectiveDate) return null;

  const historyPath = historyPathForFormat(format.id);

  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    const snapshot = getFormatBanlistSnapshot(format.id);
    return {
      effectiveDate: snapshot.effectiveDate,
      listName: snapshot.listName,
      historyPath,
    };
  }

  return {
    effectiveDate,
    listName: format.banlistHeading,
    historyPath,
  };
}

function buildCardPool(format: FormatDefinition): FormatDetailCardPool | null {
  if (format.poolRule === 'speed-duel-ygoprodeck') {
    return null;
  }
  if (format.poolRule !== 'tcg-earliest-on-or-before') return null;
  if (!format.poolThroughSet || !format.poolCutoffDate) return null;

  const notIncluded = poolNotIncludedFromExclusionNote(format.poolExclusionNote);

  return {
    cardsReleasedBy: format.poolCutoffDate,
    latestSet: format.poolThroughSet,
    notIncluded,
  };
}

function buildSpeedDuelDetailFacts(): FormatDetailFacts {
  return {
    description: SPEED_DUEL_DETAIL_INTRO,
    banList: {
      listName: 'Speed Duel Forbidden & Limited List',
    },
    cardPool: {
      cardsReleasedBy: '2024-12-13',
      latestSet: 'Speed Duel: Battle City Finals',
      notIncluded: 'Printings without the Speed Duel symbol on the card',
    },
    genesysDetail: null,
    sourceLinks: [
      {
        label: 'Speed Duel Forbidden & Limited List',
        href: KONAMI_SPEED_DUEL_FNL_PAGE_URL,
      },
      {
        label: 'Konami Speed Duel Guide (PDF)',
        href: KONAMI_SPEED_DUEL_GUIDE_URL,
      },
    ],
  };
}

/** Built from catalog entries and curated snapshot JSON only. */
export function buildFormatDetailFacts(format: FormatDefinition): FormatDetailFacts {
  if (format.id === 'speed-duel') {
    return buildSpeedDuelDetailFacts();
  }

  const description = format.description?.trim() ? format.description.trim() : null;

  if (format.banlistSource === 'genesys-points') {
    const konami = getGenesysKonamiPointsDocument();
    return {
      description,
      banList: null,
      cardPool: null,
      genesysDetail: {
        banListName: format.banlistHeading,
        pointCap: konami.standardPointCap ?? DEFAULT_GENESYS_POINT_CAP,
        notIncluded: 'Link and Pendulum Monsters',
      },
      sourceLinks: mergeSourceLinks([], format.detailSourceLinks),
    };
  }

  let sourceLinks: FormatSourceLink[] = [];
  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    sourceLinks = snapshotSourceLinks(format.id);
  } else {
    const tcgLink = linkFromSortDateSource(format.sortDateSource);
    if (tcgLink) {
      sourceLinks = [tcgLink];
    }
  }

  sourceLinks = mergeSourceLinks(sourceLinks, format.detailSourceLinks);

  return {
    description,
    banList: buildBanList(format),
    cardPool: buildCardPool(format),
    genesysDetail: null,
    sourceLinks,
  };
}
