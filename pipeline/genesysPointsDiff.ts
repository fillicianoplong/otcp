import {
  getGenesysKonamiPointsDocument,
  lookupKonamiGenesysPointsByName,
  type GenesysKonamiPointEntry,
} from '../src/format/genesysKonamiPoints.ts';
import type { YugiohCard } from '../src/shared/schema/card.ts';

export type GenesysPointDiffKind = 'point-mismatch' | 'missing-on-konami' | 'missing-in-ingest';

export type GenesysPointDiffEntry = {
  readonly kind: GenesysPointDiffKind;
  readonly cardId: number;
  readonly name: string;
  readonly ingestPoints: number | null;
  readonly konamiPoints: number | null;
};

export type GenesysPointsDiffReport = {
  readonly konamiSourceUrl: string;
  readonly konamiRetrievedAt: string;
  readonly diffCount: number;
  readonly diffs: readonly GenesysPointDiffEntry[];
};

function ingestPointsForCard(card: YugiohCard): number | null {
  if (typeof card.genesysPoints !== 'number') {
    return null;
  }
  return card.genesysPoints;
}

/**
 * Spot-checks YGOPRODeck `genesys_points` against the stored Konami list (FR-49, OD-11).
 * Diffs are reported only; Konami values are never auto-applied to published cards.
 */
export function computeGenesysPointsDiff(cards: readonly YugiohCard[]): GenesysPointsDiffReport {
  const konami = getGenesysKonamiPointsDocument();
  const diffs: GenesysPointDiffEntry[] = [];
  const konamiNamesWithIngest = new Set<string>();

  for (const card of cards) {
    const ingest = ingestPointsForCard(card);
    const konamiPoints = lookupKonamiGenesysPointsByName(card.name);
    if (konamiPoints != null) {
      konamiNamesWithIngest.add(card.name);
    }

    if (ingest == null && konamiPoints == null) {
      continue;
    }

    if (ingest != null && konamiPoints == null) {
      diffs.push({
        kind: 'missing-on-konami',
        cardId: card.id,
        name: card.name,
        ingestPoints: ingest,
        konamiPoints: null,
      });
      continue;
    }

    if (ingest == null && konamiPoints != null) {
      diffs.push({
        kind: 'missing-in-ingest',
        cardId: card.id,
        name: card.name,
        ingestPoints: null,
        konamiPoints,
      });
      continue;
    }

    if (ingest !== konamiPoints) {
      diffs.push({
        kind: 'point-mismatch',
        cardId: card.id,
        name: card.name,
        ingestPoints: ingest,
        konamiPoints: konamiPoints ?? null,
      });
    }
  }

  diffs.sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  );

  return {
    konamiSourceUrl: konami.source.url,
    konamiRetrievedAt: konami.source.retrievedAt,
    diffCount: diffs.length,
    diffs,
  };
}

export function formatGenesysPointsDiffForLog(report: GenesysPointsDiffReport): string {
  if (report.diffCount === 0) {
    return 'Genesys points spot-check: no diffs against Konami reference.';
  }
  const lines = [
    `Genesys points spot-check: ${report.diffCount} diff(s) vs ${report.konamiSourceUrl} (${report.konamiRetrievedAt}). Not auto-applied.`,
  ];
  for (const diff of report.diffs.slice(0, 25)) {
    lines.push(
      `  ${diff.kind} ${diff.name} (#${diff.cardId}): ingest=${diff.ingestPoints ?? '—'} konami=${diff.konamiPoints ?? '—'}`,
    );
  }
  if (report.diffs.length > 25) {
    lines.push(`  … ${report.diffs.length - 25} more`);
  }
  return lines.join('\n');
}

/** Test helper: list Konami entries not matched during diff (unused cards in catalog). */
export function konamiEntriesWithoutIngestMatch(
  cards: readonly YugiohCard[],
): readonly GenesysKonamiPointEntry[] {
  const names = new Set(cards.map((card) => card.name));
  return getGenesysKonamiPointsDocument().entries.filter((entry) => !names.has(entry.name));
}
