import type { ApiCard, TrimmedCard } from './types.ts';

export function trimCard(card: ApiCard): TrimmedCard {
  const trimmed: TrimmedCard = {
    id: card.id,
    name: card.name,
    desc: card.desc ?? '',
    type: card.type ?? '',
    race: card.race ?? '',
  };
  if (card.attribute) trimmed.attribute = card.attribute;
  if (typeof card.level === 'number') trimmed.level = card.level;
  if (typeof card.linkval === 'number') trimmed.linkval = card.linkval;
  if (typeof card.atk === 'number') trimmed.atk = card.atk;
  if (typeof card.def === 'number') trimmed.def = card.def;
  if (card.archetype) trimmed.archetype = card.archetype;
  const ban = card.banlist_info?.ban_tcg;
  if (ban) trimmed.banTcg = ban;
  return trimmed;
}
