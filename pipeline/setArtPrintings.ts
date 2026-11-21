/**
 * Builds the set → artwork table for cards with more than one artwork.
 *
 * The official card database lists every printing of a card with the artwork it uses
 * (`pack_iid_<n>` on each pack row). Those artwork numbers are matched to the YGOPRODeck
 * image ids the app shows, using the reviewed table in `setArtReview.json`.
 */

/** One pack row from the official card database. */
export type OfficialPrintingRow = {
  setCode: string;
  packName: string;
  rarity: string;
  artwork: number;
};

/** The parts of a YGOPRODeck card this builder needs. */
export type MultiArtCard = {
  id: number;
  name: string;
  artIds: readonly number[];
  sets: readonly { setCode: string; setName: string; setRarity: string }[];
};

/** Reviewed matches: official artwork number → app image id, or null when the app has no image for it. */
export type SetArtReview = {
  artworks: Record<string, { name: string; konamiId: number; ciid: Record<string, number | null> }>;
  /** Printings the official database does not list, matched from card scans. */
  printings: Record<string, { name: string; sets: Record<string, number> }>;
};

/** Compact output: set names and rarities are stored once and referenced by index. */
export type SetArtPrintingsFile = {
  sets: string[];
  rarities: string[];
  /** card id → [set code, set index, image id, rarity index] */
  cards: Record<string, [string, number, number, number][]>;
};

export type UnmappedReason = 'art-not-in-app' | 'not-listed' | 'not-reviewed';

export type SetArtBuildReport = {
  cards: number;
  printings: number;
  mapped: number;
  unmapped: {
    card: string;
    setCode: string;
    setName: string;
    rarity: string;
    reason: UnmappedReason;
  }[];
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Reads the pack rows (set code, pack name, rarity, artwork number) from a card's detail page. */
export function parseOfficialPrintings(html: string): OfficialPrintingRow[] {
  const rows: OfficialPrintingRow[] = [];
  const rowPattern =
    /<div class="t_row\s+pack_iid_(\d+)">([\s\S]*?)<div class="icon rarity">([\s\S]*?)<\/div><!-- \.icon -->/g;
  for (const match of html.matchAll(rowPattern)) {
    const body = match[2] ?? '';
    const setCode = /card_number">\s*([\s\S]*?)\s*<\/div>/.exec(body)?.[1]?.trim();
    const packName = /pack_name flex_1"\s*>\s*([\s\S]*?)\s*<\/div>/.exec(body)?.[1]?.trim();
    const rarity = /<span[^>]*>\s*([\s\S]*?)\s*<\/span>/.exec(match[3] ?? '')?.[1]?.trim() ?? '';
    if (!setCode || !packName) continue;
    rows.push({
      setCode: decodeEntities(setCode),
      packName: decodeEntities(packName),
      rarity: decodeEntities(rarity),
      artwork: Number(match[1]),
    });
  }
  return rows;
}

/** Artwork image paths on a card's detail page, by artwork number. */
export function parseOfficialArtworkImages(html: string): Map<number, string> {
  const images = new Map<number, string>();
  const pattern = /#update_list_card_image_(\d+)'\)\.attr\('src',\s*'([^']+)'/g;
  for (const match of html.matchAll(pattern)) {
    images.set(Number(match[1]), decodeEntities(match[2] ?? ''));
  }
  return images;
}

function normalized(text: string): string {
  return decodeEntities(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function setPrefix(setCode: string): string {
  return setCode.split('-')[0] ?? setCode;
}

/**
 * Finds the official artwork numbers for one printing.
 * 1. Same set code (and rarity, when one set code was printed with more than one artwork).
 * 2. Same set under another region's code (LOB-E003 and LOB-EN005), when that set used one artwork.
 * 3. Same set name, when that set used one artwork.
 */
export function officialArtworksForPrinting(
  rows: readonly OfficialPrintingRow[],
  printing: { setCode: string; setName: string; setRarity: string },
): number[] | undefined {
  const sameCode = rows.filter((row) => row.setCode === printing.setCode);
  if (sameCode.length > 0) {
    const all = [...new Set(sameCode.map((row) => row.artwork))];
    if (all.length === 1) return all;
    const rarity = normalized(printing.setRarity);
    const byRarity = [
      ...new Set(
        sameCode.filter((row) => normalized(row.rarity) === rarity).map((row) => row.artwork),
      ),
    ];
    return byRarity.length > 0 ? byRarity : all;
  }
  const prefix = setPrefix(printing.setCode);
  const samePrefix = [
    ...new Set(rows.filter((row) => setPrefix(row.setCode) === prefix).map((row) => row.artwork)),
  ];
  if (samePrefix.length === 1) return samePrefix;
  if (samePrefix.length > 1) return undefined;
  const name = normalized(printing.setName);
  const sameName = [
    ...new Set(rows.filter((row) => normalized(row.packName) === name).map((row) => row.artwork)),
  ];
  return sameName.length === 1 ? sameName : undefined;
}

/** Builds the set → artwork table and a coverage report. */
export function buildSetArtPrintings(
  cards: readonly MultiArtCard[],
  officialRowsByCardId: ReadonlyMap<number, readonly OfficialPrintingRow[]>,
  review: SetArtReview,
): { file: SetArtPrintingsFile; report: SetArtBuildReport } {
  const sets: string[] = [];
  const rarities: string[] = [];
  const indexOf = (list: string[], value: string) => {
    let index = list.indexOf(value);
    if (index < 0) {
      list.push(value);
      index = list.length - 1;
    }
    return index;
  };
  const file: SetArtPrintingsFile = { sets, rarities, cards: {} };
  const report: SetArtBuildReport = { cards: 0, printings: 0, mapped: 0, unmapped: [] };

  for (const card of [...cards].sort((a, b) => a.id - b.id)) {
    report.cards += 1;
    const reviewed = review.artworks[String(card.id)]?.ciid ?? {};
    const scanned = review.printings[String(card.id)]?.sets ?? {};
    const rows = officialRowsByCardId.get(card.id) ?? [];
    const out: [string, number, number, number][] = [];

    for (const printing of card.sets) {
      report.printings += 1;
      const official = officialArtworksForPrinting(rows, printing);
      let imageIds: number[] = [];
      let reason: UnmappedReason | undefined;

      if (official) {
        const decisions = official.map((artwork) => reviewed[String(artwork)]);
        if (decisions.some((decision) => decision === undefined)) reason = 'not-reviewed';
        imageIds = [
          ...new Set(
            decisions.filter(
              (id): id is number => typeof id === 'number' && card.artIds.includes(id),
            ),
          ),
        ];
        if (imageIds.length === 0 && !reason) reason = 'art-not-in-app';
      } else if (
        scanned[printing.setCode] != null &&
        card.artIds.includes(scanned[printing.setCode]!)
      ) {
        imageIds = [scanned[printing.setCode]!];
      } else {
        reason = 'not-listed';
      }

      if (imageIds.length === 0) {
        report.unmapped.push({
          card: card.name,
          setCode: printing.setCode,
          setName: printing.setName,
          rarity: printing.setRarity,
          reason: reason ?? 'not-listed',
        });
        continue;
      }
      report.mapped += 1;
      for (const imageId of imageIds.sort(
        (a, b) => card.artIds.indexOf(a) - card.artIds.indexOf(b),
      )) {
        out.push([
          printing.setCode,
          indexOf(sets, printing.setName),
          imageId,
          indexOf(rarities, printing.setRarity),
        ]);
      }
    }
    if (out.length > 0) file.cards[String(card.id)] = out;
  }
  return { file, report };
}
