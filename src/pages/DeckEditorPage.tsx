import { Link, Navigate, useParams } from 'react-router';
import { useCallback, useMemo, useState } from 'react';

import { getGuestDeckDraft, updateGuestDeckDraft } from '../deckStore/guestDeckDraftStore.ts';
import type { GuestDeckDraft } from '../deckStore/types.ts';
import { deckAddRefusalMessage, validateDeckAdd } from '../deckEditor/deckAddValidation.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import {
  evaluateGenesysDeckPoints,
  isGenesysFormat,
  resolveGenesysPointCap,
  resolveGenesysPoints,
} from '../format/formatEngine/genesysRules.ts';
import { evaluateDeckAdd, type DeckListState } from '../format/formatEngine.ts';
import { formatDisplayName, listFormats, type FormatId } from '../format/formatCatalog.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const panelClassName = 'rounded-md border border-border bg-surface p-4';

const SAMPLE_SKILL_IDS = {
  heroesUnite: 300302050,
  ancientFusion: 300302022,
} as const;

function deckSectionLabel(main: number, extra: number, side: number): string {
  return `Main ${main}  Extra ${extra}  Side ${side}`;
}

function deckStateFromDraft(draft: GuestDeckDraft): DeckListState {
  return {
    main: draft.main,
    extra: draft.extra,
    side: draft.side,
    skillId: draft.skillId ?? null,
  };
}

function findCatalogCard(cards: readonly YugiohCard[], id: number): YugiohCard | undefined {
  return cards.find((card) => card.id === id);
}

function GenesysPointsBar({
  totalPoints,
  cap,
  overCap,
  capInput,
  onCapInputChange,
}: {
  totalPoints: number;
  cap: number;
  overCap: boolean;
  capInput: string;
  onCapInputChange: (value: string) => void;
}) {
  return (
    <div
      className={`${panelClassName} space-y-3`}
      role="status"
      aria-live="polite"
      aria-label="Genesys point total"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-text">
          Points{' '}
          <span
            className={`text-base font-semibold tabular-nums ${overCap ? 'text-ban-forbidden' : 'text-heading'}`}
          >
            {totalPoints}
          </span>{' '}
          <span className="text-text-2">/ {cap}</span>
        </p>
        {overCap ? (
          <p className="text-sm font-medium text-ban-forbidden">Over the point cap</p>
        ) : null}
      </div>
      <label className="flex flex-col gap-1 text-sm text-text">
        <span>Custom point cap (optional)</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="100"
          value={capInput}
          onChange={(event) => onCapInputChange(event.target.value)}
          className="min-h-[var(--touch-min)] w-full max-w-[8rem] rounded-md border border-border bg-bg px-3 text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        />
      </label>
    </div>
  );
}

export function DeckEditorPage() {
  const { draftId } = useParams();
  const { state: catalogState } = useCardCatalog();
  const initialDraft = draftId ? getGuestDeckDraft(draftId) : null;
  const [draft, setDraft] = useState<GuestDeckDraft | null>(initialDraft);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [skillRefusalMessage, setSkillRefusalMessage] = useState<string | null>(null);
  const [capInput, setCapInput] = useState(() =>
    initialDraft?.genesysCap != null ? String(initialDraft.genesysCap) : '',
  );

  const catalogById = useMemo(() => {
    if (catalogState.status !== 'ready') {
      return new Map<number, YugiohCard>();
    }
    return new Map(catalogState.cards.map((card) => [card.id, card]));
  }, [catalogState]);

  const lookupCard = useCallback((id: number) => catalogById.get(id), [catalogById]);

  const catalogCards = catalogState.status === 'ready' ? catalogState.cards : [];

  const skillCard =
    draft?.skillId != null ? (findCatalogCard(catalogCards, draft.skillId) ?? null) : null;

  const genesysStatus = useMemo(() => {
    if (!draft || !isGenesysFormat(draft.formatId)) {
      return null;
    }
    return evaluateGenesysDeckPoints(
      draft.main,
      draft.extra,
      draft.side,
      (id) => lookupCard(id),
      draft.genesysCap,
    );
  }, [draft, lookupCard]);

  if (!draftId || !draft) {
    return <Navigate to="/decks" replace />;
  }

  const handleFormatChange = (formatId: FormatId) => {
    const next = updateGuestDeckDraft(draft.id, {
      formatId,
      ...(formatId !== 'genesys' ? { genesysCap: null } : {}),
      ...(formatId !== 'speed-duel' ? { skillId: null } : {}),
    });
    if (next) {
      setDraft(next);
      setSkillRefusalMessage(null);
      if (formatId !== 'genesys') {
        setCapInput('');
      }
    }
  };

  const handleCapInputChange = (raw: string) => {
    setCapInput(raw);
    if (raw.trim() === '') {
      const next = updateGuestDeckDraft(draft.id, { genesysCap: null });
      if (next) setDraft(next);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    const next = updateGuestDeckDraft(draft.id, { genesysCap: Math.trunc(parsed) });
    if (next) setDraft(next);
  };

  const trySetSkill = (skillCardId: number) => {
    if (catalogState.status !== 'ready') {
      setSkillRefusalMessage('Catalog is still loading.');
      return;
    }
    const card = findCatalogCard(catalogCards, skillCardId);
    if (!card) {
      setSkillRefusalMessage('That Skill card is not in the loaded catalog.');
      return;
    }
    const evaluation = evaluateDeckAdd(card, 'skill', deckStateFromDraft(draft), draft.formatId);
    if (!evaluation.ok) {
      setSkillRefusalMessage(evaluation.message);
      return;
    }
    setSkillRefusalMessage(null);
    const next = updateGuestDeckDraft(draft.id, { skillId: skillCardId });
    if (next) setDraft(next);
  };

  const handleAddByPasscode = () => {
    setStatusMessage(null);
    if (catalogState.status !== 'ready') {
      setStatusMessage('Catalog is still loading.');
      return;
    }
    const digitMatch = passcodeInput.trim().match(/\d+/);
    const passcode = digitMatch ? Number(digitMatch[0]) : Number.NaN;
    if (!Number.isFinite(passcode) || passcode <= 0) {
      setStatusMessage('Enter a valid passcode.');
      return;
    }
    const card =
      catalogState.cards.find((entry) => entry.passcode === passcode) ??
      catalogState.cards.find((entry) => entry.id === passcode);
    if (!card) {
      setStatusMessage('No card found for that passcode.');
      return;
    }

    const validation = validateDeckAdd(card, draft.formatId, draft.main, draft.extra, draft.side);
    if (!validation.ok) {
      setStatusMessage(deckAddRefusalMessage(validation.reason));
      return;
    }

    const typeLower = card.type.toLowerCase();
    const targetSection =
      typeLower.includes('fusion') ||
      typeLower.includes('synchro') ||
      typeLower.includes('xyz') ||
      typeLower.includes('link')
        ? 'extra'
        : 'main';

    const nextMain = targetSection === 'main' ? [...draft.main, card.id] : draft.main;
    const nextExtra = targetSection === 'extra' ? [...draft.extra, card.id] : draft.extra;

    const updated = updateGuestDeckDraft(draft.id, { main: nextMain, extra: nextExtra });
    if (updated) {
      setDraft(updated);
      setPasscodeInput('');
      if (isGenesysFormat(updated.formatId)) {
        const points = resolveGenesysPoints(card);
        setStatusMessage(
          points > 0 ? `Added ${card.name} (+${points} pts).` : `Added ${card.name}.`,
        );
      } else {
        setStatusMessage(`Added ${card.name}.`);
      }
    }
  };

  const effectiveCap = genesysStatus?.cap ?? resolveGenesysPointCap(draft.genesysCap);

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to="/decks"
            className="text-sm font-medium text-heading underline-offset-2 hover:underline"
          >
            ← My decks
          </Link>
          <h1 className="truncate text-2xl font-semibold text-heading">{draft.name}</h1>
          <p className="text-sm text-text-2">
            {formatDisplayName(draft.formatId)}{' '}
            {deckSectionLabel(draft.main.length, draft.extra.length, draft.side.length)}
          </p>
        </div>
      </div>

      <div className={`${panelClassName} space-y-2`}>
        <label className="flex flex-col gap-1 text-sm text-text" htmlFor="deck-format-select">
          <span>Format</span>
          <select
            id="deck-format-select"
            value={draft.formatId}
            onChange={(event) => handleFormatChange(event.target.value as FormatId)}
            className="min-h-[var(--touch-min)] rounded-md border border-border bg-bg px-3 text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            {listFormats().map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isGenesysFormat(draft.formatId) && genesysStatus ? (
        <GenesysPointsBar
          totalPoints={genesysStatus.totalPoints}
          cap={effectiveCap}
          overCap={genesysStatus.overCap}
          capInput={capInput}
          onCapInputChange={handleCapInputChange}
        />
      ) : null}

      {draft.formatId === 'speed-duel' ? (
        <div className={`${panelClassName} space-y-3`} aria-labelledby="skill-heading">
          <h2 id="skill-heading" className="text-base font-semibold text-heading">
            Skill card
          </h2>
          <p className="text-sm text-text-2">
            Speed Duel allows one active Skill. It does not count toward Main Deck size.
          </p>
          {skillCard ? (
            <p className="text-sm text-heading">
              Active Skill: <span className="font-medium">{skillCard.name}</span>
            </p>
          ) : (
            <p className="text-sm text-text-2">No Skill selected yet.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90"
              onClick={() => trySetSkill(SAMPLE_SKILL_IDS.heroesUnite)}
            >
              Set HEROES UNITE - FUSION!!
            </button>
            <button
              type="button"
              className="inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong"
              onClick={() => trySetSkill(SAMPLE_SKILL_IDS.ancientFusion)}
            >
              Set Ancient Fusion
            </button>
          </div>
          {skillRefusalMessage ? (
            <p className="text-sm text-heading" role="alert">
              {skillRefusalMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`${panelClassName} space-y-3`}>
        <h2 className="text-base font-semibold text-heading">Add card</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-text">
            <span>Passcode</span>
            <input
              value={passcodeInput}
              onChange={(event) => setPasscodeInput(event.target.value)}
              className="min-h-[var(--touch-min)] rounded-md border border-border bg-bg px-3 tabular-nums text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              inputMode="numeric"
            />
          </label>
          <button
            type="button"
            onClick={handleAddByPasscode}
            className="inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90"
          >
            Add to deck
          </button>
        </div>
        {statusMessage ? (
          <p className="text-sm text-text" role="status">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
