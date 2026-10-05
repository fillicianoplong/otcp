import type { YugiohCard } from '../shared/schema/card.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import { deckSectionLimitsForFormat, formatUsesSkillSlot } from './formatDeckRules.ts';
import { isCardInFormatPool } from './formatPool.ts';
import { getFormatById, normalizeFormatId } from './formatCatalog.ts';
import { isSkillCard } from './speedDuel.ts';

export type DeckSection = 'main' | 'extra' | 'side' | 'skill';

export type DeckListState = {
  readonly main: readonly number[];
  readonly extra: readonly number[];
  readonly side: readonly number[];
  readonly skillId?: number | null;
};

export type RefuseDeckAddReason =
  'not-in-pool' | 'second-skill' | 'skill-not-allowed' | 'section-full' | 'wrong-section';

export type DeckAddEvaluation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: RefuseDeckAddReason; readonly message: string };

export type DeckSizeViolation =
  'main-below-min' | 'main-over-max' | 'extra-over-max' | 'side-over-max';

export function countMainDeckCards(deck: DeckListState): number {
  return deck.main.length;
}

export function activeSkillId(deck: DeckListState): number | null {
  if (deck.skillId != null && deck.skillId > 0) {
    return deck.skillId;
  }
  return null;
}

export function evaluateDeckAdd(
  card: YugiohCard,
  section: DeckSection,
  deck: DeckListState,
  formatParam: string | null | undefined,
  setIndex?: SetIndex | null,
): DeckAddEvaluation {
  const formatId = normalizeFormatId(formatParam);
  const format = formatId ? getFormatById(formatId) : undefined;
  if (!format) {
    return { ok: true };
  }

  if (!isCardInFormatPool(card, formatId, setIndex)) {
    return {
      ok: false,
      reason: 'not-in-pool',
      message: `${card.name} is not legal in ${format.name}.`,
    };
  }

  const limits = deckSectionLimitsForFormat(formatId);

  if (section === 'skill' || (section === 'main' && isSkillCard(card))) {
    if (!formatUsesSkillSlot(formatId)) {
      return {
        ok: false,
        reason: 'skill-not-allowed',
        message: 'Skill cards are only used in Speed Duel.',
      };
    }
    if (!isSkillCard(card)) {
      return {
        ok: false,
        reason: 'skill-not-allowed',
        message: 'Only Skill cards can be placed in the Skill slot.',
      };
    }
    const current = activeSkillId(deck);
    if (current != null && current !== card.id) {
      return {
        ok: false,
        reason: 'second-skill',
        message: 'Speed Duel allows one active Skill card.',
      };
    }
    return { ok: true };
  }

  if (isSkillCard(card)) {
    return evaluateDeckAdd(card, 'skill', deck, formatParam, setIndex);
  }

  if (section === 'extra') {
    if (deck.extra.length >= limits.extraMax) {
      return {
        ok: false,
        reason: 'section-full',
        message: `Extra Deck cannot exceed ${limits.extraMax} cards in ${format.name}.`,
      };
    }
    return { ok: true };
  }

  if (section === 'side') {
    if (deck.side.length >= limits.sideMax) {
      return {
        ok: false,
        reason: 'section-full',
        message: `Side Deck cannot exceed ${limits.sideMax} cards in ${format.name}.`,
      };
    }
    return { ok: true };
  }

  if (section === 'main') {
    if (deck.main.length >= limits.mainMax) {
      return {
        ok: false,
        reason: 'section-full',
        message: `Main Deck cannot exceed ${limits.mainMax} cards in ${format.name}.`,
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    reason: 'wrong-section',
    message: 'That card cannot be added to this section.',
  };
}

export function evaluateDeckSizes(
  deck: DeckListState,
  formatParam: string | null | undefined,
): readonly DeckSizeViolation[] {
  const limits = deckSectionLimitsForFormat(formatParam);
  const violations: DeckSizeViolation[] = [];
  const mainCount = countMainDeckCards(deck);
  if (mainCount < limits.mainMin) {
    violations.push('main-below-min');
  }
  if (mainCount > limits.mainMax) {
    violations.push('main-over-max');
  }
  if (deck.extra.length > limits.extraMax) {
    violations.push('extra-over-max');
  }
  if (deck.side.length > limits.sideMax) {
    violations.push('side-over-max');
  }
  return violations;
}

export function deckSizeViolationMessage(
  violation: DeckSizeViolation,
  formatParam: string | null | undefined,
): string {
  const limits = deckSectionLimitsForFormat(formatParam);
  const formatName = getFormatById(normalizeFormatId(formatParam) ?? '')?.name ?? 'this format';
  switch (violation) {
    case 'main-below-min':
      return `${formatName} Main Deck must have at least ${limits.mainMin} cards.`;
    case 'main-over-max':
      return `${formatName} Main Deck cannot exceed ${limits.mainMax} cards.`;
    case 'extra-over-max':
      return `${formatName} Extra Deck cannot exceed ${limits.extraMax} cards.`;
    case 'side-over-max':
      return `${formatName} Side Deck cannot exceed ${limits.sideMax} cards.`;
  }
}

export { deckSectionLimitsForFormat } from './formatDeckRules.ts';
