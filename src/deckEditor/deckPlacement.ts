import type { FormatId } from '../format/formatCatalog.ts';
import { deckSectionLimitsForFormat } from '../format/formatDeckRules.ts';
import { evaluateDeckAdd, type DeckListState } from '../format/formatEngine.ts';
import { isSkillCard } from '../format/speedDuel.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { deckAddRefusalMessage, validateDeckAdd } from './deckAddValidation.ts';

export type DeckZone = 'main' | 'extra' | 'side';

/** Where a library add lands. Auto sends Extra Deck monsters to Extra and other cards to Main. */
export type DeckAddTarget = 'auto' | DeckZone;

export type DeckCardLists = {
  main: number[];
  extra: number[];
  side: number[];
  skillId?: number | null;
};

export const DECK_ZONES: readonly DeckZone[] = ['main', 'extra', 'side'];

/** Custom drag payload. `text/plain` is written too, for browsers that drop unknown types. */
export const DECK_CARD_DRAG_MIME = 'application/x-otcp-card-id';

const EXTRA_DECK_TYPE_MARKERS = ['fusion', 'synchro', 'xyz', 'link'] as const;

export function deckZoneLabel(zone: DeckZone): 'Main' | 'Extra' | 'Side' {
  switch (zone) {
    case 'main':
      return 'Main';
    case 'extra':
      return 'Extra';
    case 'side':
      return 'Side';
  }
}

export function deckZoneMax(zone: DeckZone, formatId: FormatId): number {
  const limits = deckSectionLimitsForFormat(formatId);
  if (zone === 'main') return limits.mainMax;
  if (zone === 'extra') return limits.extraMax;
  return limits.sideMax;
}

/**
 * Fusion, Synchro, Xyz, and Link monsters (including Pendulum versions of those).
 * A Pendulum Effect Monster with none of those words stays in Main.
 */
export function isExtraDeckMonster(card: Pick<YugiohCard, 'type'>): boolean {
  const type = card.type.toLowerCase();
  if (type.includes('spell') || type.includes('trap') || type.includes('skill')) {
    return false;
  }
  return EXTRA_DECK_TYPE_MARKERS.some((marker) => type.includes(marker));
}

export type DeckDragSource = 'library' | DeckZone;

export type DeckDragPayload = {
  cardId: number;
  from: DeckDragSource;
  sourceIndex?: number;
};

export function writeDeckDrag(dataTransfer: DataTransfer, payload: DeckDragPayload): void {
  const id = String(payload.cardId);
  let encoded: string;
  try {
    encoded = JSON.stringify(payload);
  } catch {
    encoded = id;
  }
  try {
    dataTransfer.setData(DECK_CARD_DRAG_MIME, encoded);
  } catch {
    // Some engines only accept a fixed set of types during dragstart.
  }
  try {
    dataTransfer.setData('text/plain', id);
  } catch {
    // The editor also keeps the dragged payload in memory.
  }
  try {
    dataTransfer.effectAllowed = payload.from === 'library' ? 'copy' : 'move';
  } catch {
    // Ignore when the transfer object is read-only.
  }
}

export function writeDraggedCardId(dataTransfer: DataTransfer, cardId: number): void {
  writeDeckDrag(dataTransfer, { cardId, from: 'library' });
}

export function readDeckDrag(
  dataTransfer: DataTransfer,
  fallback: DeckDragPayload | null,
): DeckDragPayload | null {
  let raw: string;
  try {
    raw = dataTransfer.getData(DECK_CARD_DRAG_MIME) || dataTransfer.getData('text/plain');
  } catch {
    raw = '';
  }
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Partial<DeckDragPayload>;
      const cardId = Number(parsed.cardId);
      if (!Number.isInteger(cardId) || cardId <= 0) return fallback;
      const from = parsed.from;
      if (from === 'main' || from === 'extra' || from === 'side' || from === 'library') {
        return {
          cardId,
          from,
          ...(typeof parsed.sourceIndex === 'number' ? { sourceIndex: parsed.sourceIndex } : {}),
        };
      }
    } catch {
      return fallback;
    }
  }
  const parsedId = Number(raw);
  if (Number.isInteger(parsedId) && parsedId > 0) return { cardId: parsedId, from: 'library' };
  return fallback;
}

export function readDraggedCardId(
  dataTransfer: DataTransfer,
  fallback: number | null,
): number | null {
  return (
    readDeckDrag(dataTransfer, fallback == null ? null : { cardId: fallback, from: 'library' })
      ?.cardId ?? null
  );
}

export function deckCopyCount(cardId: number, lists: DeckCardLists): number {
  let count = 0;
  for (const id of lists.main) if (id === cardId) count += 1;
  for (const id of lists.extra) if (id === cardId) count += 1;
  for (const id of lists.side) if (id === cardId) count += 1;
  if (lists.skillId === cardId) count += 1;
  return count;
}

export function groupZoneCardIds(
  ids: readonly number[],
): readonly { cardId: number; qty: number }[] {
  const order: number[] = [];
  const qty = new Map<number, number>();
  for (const id of ids) {
    const current = qty.get(id);
    if (current == null) {
      order.push(id);
      qty.set(id, 1);
    } else {
      qty.set(id, current + 1);
    }
  }
  return order.map((cardId) => ({ cardId, qty: qty.get(cardId) ?? 0 }));
}

export type DeckAddSuccess = {
  ok: true;
  lists: DeckCardLists;
  placedIn: DeckZone | 'skill';
  message: string;
};

export type DeckAddFailure = {
  ok: false;
  message: string;
};

function cloneLists(lists: DeckCardLists): DeckCardLists {
  return {
    main: [...lists.main],
    extra: [...lists.extra],
    side: [...lists.side],
    skillId: lists.skillId ?? null,
  };
}

function deckStateFromLists(lists: DeckCardLists): DeckListState {
  return {
    main: lists.main,
    extra: lists.extra,
    side: lists.side,
    skillId: lists.skillId ?? null,
  };
}

function placeSkill(
  card: YugiohCard,
  target: DeckAddTarget,
  formatId: FormatId,
  lists: DeckCardLists,
  setIndex: SetIndex | null | undefined,
): DeckAddSuccess | DeckAddFailure {
  if (target !== 'auto') {
    return {
      ok: false,
      message: `${card.name} is a Skill card. Put it in the Skill slot, not ${deckZoneLabel(target)}.`,
    };
  }

  const evaluation = evaluateDeckAdd(card, 'skill', deckStateFromLists(lists), formatId, setIndex);
  if (!evaluation.ok) {
    return { ok: false, message: evaluation.message };
  }

  return {
    ok: true,
    lists: { ...cloneLists(lists), skillId: card.id },
    placedIn: 'skill',
    message: `Set Skill to ${card.name}.`,
  };
}

/**
 * Add one copy. Extra Deck monsters go to Extra when the target is auto.
 * Dropping one on Main is refused, not stored in Main. Format bans refuse with the format reason.
 */
export function addCardToDeck(
  card: YugiohCard,
  target: DeckAddTarget,
  formatId: FormatId,
  lists: DeckCardLists,
  setIndex?: SetIndex | null,
): DeckAddSuccess | DeckAddFailure {
  if (isSkillCard(card)) {
    return placeSkill(card, target, formatId, lists, setIndex);
  }

  const zone: DeckZone = target === 'auto' ? (isExtraDeckMonster(card) ? 'extra' : 'main') : target;

  const validation = validateDeckAdd(card, formatId, lists.main, lists.extra, lists.side, setIndex);
  if (!validation.ok) {
    return { ok: false, message: deckAddRefusalMessage(validation.reason) };
  }

  if (isExtraDeckMonster(card) && zone === 'main') {
    return {
      ok: false,
      message: `${card.name} is an Extra Deck monster. Add it to Extra or Side, not Main.`,
    };
  }

  if (!isExtraDeckMonster(card) && zone === 'extra') {
    return {
      ok: false,
      message: `${card.name} cannot go in the Extra Deck. Extra is for Fusion, Synchro, Xyz, and Link Monsters.`,
    };
  }

  const evaluation = evaluateDeckAdd(card, zone, deckStateFromLists(lists), formatId, setIndex);
  if (!evaluation.ok) {
    return { ok: false, message: evaluation.message };
  }

  const next = cloneLists(lists);
  next[zone] = [...next[zone], card.id];
  return {
    ok: true,
    lists: next,
    placedIn: zone,
    message: `Added ${card.name} to ${deckZoneLabel(zone)}.`,
  };
}

function removeOneCardId(ids: readonly number[], cardId: number): number[] {
  const index = ids.lastIndexOf(cardId);
  if (index < 0) return [...ids];
  return ids.filter((_, entryIndex) => entryIndex !== index);
}

function zonesToSearch(card: YugiohCard, target: DeckAddTarget): DeckZone[] {
  const preferred: DeckZone =
    target === 'auto' ? (isExtraDeckMonster(card) ? 'extra' : 'main') : target;
  const rest = DECK_ZONES.filter((zone) => zone !== preferred);
  return [preferred, ...rest];
}

/** Move one copy. The source copy is removed only when the destination accepts the card. */
export function moveCardBetweenZones(
  card: YugiohCard,
  from: DeckZone,
  to: DeckZone,
  formatId: FormatId,
  lists: DeckCardLists,
  setIndex?: SetIndex | null,
): DeckAddSuccess | DeckAddFailure {
  if (from === to) {
    return {
      ok: true,
      lists,
      placedIn: to,
      message: `${card.name} stays in ${deckZoneLabel(to)}.`,
    };
  }
  const removed = removeOneCardFromZone(lists, from, card.id);
  if (!removed) {
    return { ok: false, message: `${card.name} is not in ${deckZoneLabel(from)}.` };
  }
  const added = addCardToDeck(card, to, formatId, removed, setIndex);
  if (!added.ok) return { ok: false, message: added.message };
  return { ...added, message: `Moved ${card.name} to ${deckZoneLabel(to)}.` };
}

export function removeOneCardFromZone(
  lists: DeckCardLists,
  zone: DeckZone,
  cardId: number,
): DeckCardLists | null {
  if (!lists[zone].includes(cardId)) return null;
  const next = cloneLists(lists);
  next[zone] = removeOneCardId(lists[zone], cardId);
  return next;
}

/** Remove one library copy, preferring the zone the current add target would use. */
export function removeOneLibraryCopy(
  card: YugiohCard,
  target: DeckAddTarget,
  lists: DeckCardLists,
): { lists: DeckCardLists; message: string } | null {
  if (isSkillCard(card)) {
    if ((lists.skillId ?? null) !== card.id) return null;
    return {
      lists: { ...cloneLists(lists), skillId: null },
      message: `Cleared Skill ${card.name}.`,
    };
  }

  for (const zone of zonesToSearch(card, target)) {
    if (!lists[zone].includes(card.id)) continue;
    const next = cloneLists(lists);
    next[zone] = removeOneCardId(lists[zone], card.id);
    return {
      lists: next,
      message: `Removed one ${card.name} from ${deckZoneLabel(zone)}.`,
    };
  }
  return null;
}
