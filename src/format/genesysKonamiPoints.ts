import konamiPointsDocument from './data/genesys-konami-points.json';

export type GenesysKonamiPointEntry = {
  readonly name: string;
  readonly points: number;
};

export type GenesysKonamiPointsDocument = {
  readonly schemaVersion: number;
  readonly source: {
    readonly name: string;
    readonly url: string;
    readonly retrievedAt: string;
  };
  readonly standardPointCap: number;
  readonly entries: readonly GenesysKonamiPointEntry[];
};

const document = konamiPointsDocument as GenesysKonamiPointsDocument;

/** Normalizes card names for Konami ↔ catalog comparison. */
export function normalizeGenesysCardName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

const pointsByNormalizedName = new Map<string, number>(
  document.entries.map((entry) => [normalizeGenesysCardName(entry.name), entry.points]),
);

export function getGenesysKonamiPointsDocument(): GenesysKonamiPointsDocument {
  return document;
}

export function lookupKonamiGenesysPointsByName(name: string): number | undefined {
  return pointsByNormalizedName.get(normalizeGenesysCardName(name));
}

export function listKonamiGenesysPointEntries(): readonly GenesysKonamiPointEntry[] {
  return document.entries;
}
