import type { YugiohCard } from './card.ts';

export type MonsterLevelRankLinkInput = {
  type: string;
  level?: number;
  rank?: number;
  linkval?: number;
  linkRating?: number;
};

/** Maps YGOPRODeck level/rank/linkval onto OTCP fields (issue #157). */
export function resolveMonsterLevelRankLink(
  input: MonsterLevelRankLinkInput,
): Pick<YugiohCard, 'level' | 'rank' | 'linkRating'> {
  const type = input.type ?? '';
  if (typeof input.linkval === 'number' || type.includes('Link')) {
    const linkRating = input.linkval ?? input.linkRating;
    return linkRating != null ? { linkRating } : {};
  }
  if (type.includes('Xyz')) {
    const rank = input.rank ?? input.level;
    return rank != null ? { rank } : {};
  }
  const out: Pick<YugiohCard, 'level' | 'rank' | 'linkRating'> = {};
  if (typeof input.level === 'number') out.level = input.level;
  if (typeof input.rank === 'number') out.rank = input.rank;
  return out;
}

/** Re-applies level/rank/link rules to cards already in the published dataset. */
export function normalizeYugiohCardLevelRankLink(card: YugiohCard): YugiohCard {
  const resolved = resolveMonsterLevelRankLink({
    type: card.type,
    level: card.level,
    rank: card.rank,
    linkRating: card.linkRating,
  });
  const next: YugiohCard = { ...card };
  delete next.level;
  delete next.rank;
  delete next.linkRating;
  if (resolved.level != null) next.level = resolved.level;
  if (resolved.rank != null) next.rank = resolved.rank;
  if (resolved.linkRating != null) next.linkRating = resolved.linkRating;
  return next;
}
