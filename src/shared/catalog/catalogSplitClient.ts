import { catalogSearchSetsForBrowse } from '../schema/catalogSearch.ts';
import type { CatalogDetailOverlay, CatalogSearchCard } from '../schema/catalogSearch.ts';
import type { YugiohCard } from '../schema/card.ts';
import { OTCP_CARD_SCHEMA_VERSION } from '../schema/constants.ts';
import { publishedDefaultArtPaths } from '../cardImageUrls.ts';

function mergePublishedArtIds(
  cardId: number,
  ...lists: (readonly number[] | undefined)[]
): number[] | undefined {
  const merged = new Set<number>();
  for (const list of lists) {
    if (!list) continue;
    for (const id of list) merged.add(id);
  }
  if (merged.size === 0) return undefined;
  const primary = lists.find((list) => list && list.length > 0)?.[0] ?? cardId;
  const rest = [...merged].filter((id) => id !== primary).sort((left, right) => left - right);
  return [primary, ...rest];
}

export function detailBucketObjectName(bucket: number): string {
  return `bucket-${String(bucket).padStart(5, '0')}.json`;
}

export function detailChunkRelativePath(detailsPrefixRelative: string, bucket: number): string {
  return `${detailsPrefixRelative}${detailBucketObjectName(bucket)}`.replaceAll('\\', '/');
}

export function mergeCatalogSearchWithDetail(
  searchCard: CatalogSearchCard,
  overlay: CatalogDetailOverlay | undefined,
): YugiohCard {
  const images = publishedDefaultArtPaths(searchCard.id);
  const { setNames, rarities, detailBucket, ...core } = searchCard;
  void setNames;
  void rarities;
  void detailBucket;
  const artIds = mergePublishedArtIds(searchCard.id, searchCard.artIds, overlay?.artIds);
  const base: YugiohCard = {
    schemaVersion: OTCP_CARD_SCHEMA_VERSION,
    ...core,
    images,
    text: overlay?.text ?? searchCard.text ?? '',
    sets: overlay?.sets ?? catalogSearchSetsForBrowse(searchCard),
    ...(artIds ? { artIds } : {}),
  };
  if (!overlay) return base;
  return {
    ...base,
    ...(overlay.pendDesc ? { pendDesc: overlay.pendDesc } : {}),
    ...(overlay.monsterDesc ? { monsterDesc: overlay.monsterDesc } : {}),
    ...(overlay.scale != null ? { scale: overlay.scale } : {}),
    ...(overlay.genesysPoints != null ? { genesysPoints: overlay.genesysPoints } : {}),
  };
}
