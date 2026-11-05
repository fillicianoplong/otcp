import { Link, Navigate, useParams } from 'react-router';
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react';

import { CardFinder } from '../cardFinder/CardFinder.tsx';
import { getGuestDeckDraft, updateGuestDeckDraft } from '../deckStore/guestDeckDraftStore.ts';
import type { GuestDeckDraft, GuestDeckDraftUpdate } from '../deckStore/types.ts';
import { DeckZoneList } from '../deckEditor/DeckZoneList.tsx';
import { DECK_EDITOR_SPLIT_MIN_PX } from '../deckEditor/deckEditorLayout.ts';
import {
  addCardToDeck,
  deckCopyCount,
  deckZoneLabel,
  readDraggedCardId,
  removeOneCardFromZone,
  removeOneLibraryCopy,
  type DeckAddTarget,
  type DeckCardLists,
  type DeckZone,
} from '../deckEditor/deckPlacement.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { emptyFilterState, type FilterState } from '../catalog/filterEngine.ts';
import {
  evaluateGenesysDeckPoints,
  isGenesysFormat,
  resolveGenesysPointCap,
} from '../format/formatEngine/genesysRules.ts';
import { evaluateDeckAdd, type DeckListState } from '../format/formatEngine.ts';
import { formatDisplayName, listFormats, type FormatId } from '../format/formatCatalog.ts';
import { useMinViewportWidth } from '../hooks/useMinViewportWidth.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

const panelClassName = 'rounded-md border border-border bg-surface p-4';

const primaryButtonClassName =
  'inline-flex min-h-[var(--touch-min)] w-full items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const quietButtonClassName =
  'inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-heading hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

const SAMPLE_SKILL_IDS = {
  heroesUnite: 300302050,
  ancientFusion: 300302022,
} as const;

function listsFromDraft(draft: GuestDeckDraft): DeckCardLists {
  return {
    main: draft.main,
    extra: draft.extra,
    side: draft.side,
    skillId: draft.skillId ?? null,
  };
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
  const desktop = useMinViewportWidth(DECK_EDITOR_SPLIT_MIN_PX);
  const { state: catalogState } = useCardCatalog();
  const initialDraft = draftId ? getGuestDeckDraft(draftId) : null;
  const [draft, setDraft] = useState<GuestDeckDraft | null>(initialDraft);
  const [nameDraft, setNameDraft] = useState(initialDraft?.name ?? '');
  const [capInput, setCapInput] = useState(() =>
    initialDraft?.genesysCap != null ? String(initialDraft.genesysCap) : '',
  );
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(() => emptyFilterState());
  const [addTarget, setAddTarget] = useState<DeckAddTarget>('auto');
  const [message, setMessage] = useState<{ tone: 'ok' | 'refuse'; text: string } | null>(null);
  const [skillRefusalMessage, setSkillRefusalMessage] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [activeDropZone, setActiveDropZone] = useState<DeckZone | null>(null);
  const draggingCardId = useRef<number | null>(null);
  const filtersOpenRef = useRef(false);
  const libraryTitleId = useId();

  useEffect(() => {
    if (desktop || !libraryOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !filtersOpenRef.current) {
        setLibraryOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [desktop, libraryOpen]);

  const catalogById = useMemo(() => {
    if (catalogState.status !== 'ready') {
      return new Map<number, YugiohCard>();
    }
    return new Map(catalogState.cards.map((card) => [card.id, card]));
  }, [catalogState]);

  const setIndex = catalogState.status === 'ready' ? catalogState.setIndex : undefined;
  const catalogCards = catalogState.status === 'ready' ? catalogState.cards : [];

  const genesysStatus = useMemo(() => {
    if (!draft || !isGenesysFormat(draft.formatId)) {
      return null;
    }
    return evaluateGenesysDeckPoints(
      draft.main,
      draft.extra,
      draft.side,
      (id) => catalogById.get(id),
      draft.genesysCap,
    );
  }, [catalogById, draft]);

  if (!draftId || !draft) {
    return <Navigate to="/decks" replace />;
  }

  const showLibraryInSheet = !desktop && libraryOpen;

  const persistLists = (lists: DeckCardLists, text: string, tone: 'ok' | 'refuse') => {
    const patch: GuestDeckDraftUpdate = {
      main: lists.main,
      extra: lists.extra,
      side: lists.side,
    };
    if ((lists.skillId ?? null) !== (draft.skillId ?? null)) {
      patch.skillId = lists.skillId ?? null;
    }
    const updated = updateGuestDeckDraft(draft.id, patch);
    if (!updated) return;
    setDraft(updated);
    setMessage({ tone, text });
  };

  const handleAddCard = (card: YugiohCard, target: DeckAddTarget) => {
    const result = addCardToDeck(card, target, draft.formatId, listsFromDraft(draft), setIndex);
    if (!result.ok) {
      setMessage({ tone: 'refuse', text: result.message });
      return;
    }
    persistLists(result.lists, result.message, 'ok');
  };

  const handleLibraryRemove = (card: YugiohCard) => {
    const result = removeOneLibraryCopy(card, addTarget, listsFromDraft(draft));
    if (!result) return;
    persistLists(result.lists, result.message, 'ok');
  };

  const handleRemoveFromZone = (zone: DeckZone, cardId: number) => {
    const next = removeOneCardFromZone(listsFromDraft(draft), zone, cardId);
    if (!next) return;
    const card = catalogById.get(cardId);
    const label = card?.name ?? `Card ${cardId}`;
    persistLists(next, `Removed one ${label} from ${deckZoneLabel(zone)}.`, 'ok');
  };

  const handleDrop = (zone: DeckZone, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setActiveDropZone(null);
    const cardId = readDraggedCardId(event.dataTransfer, draggingCardId.current);
    draggingCardId.current = null;
    if (cardId == null) return;
    const card = catalogById.get(cardId);
    if (!card) {
      setMessage({ tone: 'refuse', text: 'That card is not in the loaded catalog.' });
      return;
    }
    handleAddCard(card, zone);
  };

  const commitName = () => {
    const stored = nameDraft.trim() || 'Untitled deck';
    if (stored === draft.name) {
      setNameDraft(draft.name);
      return;
    }
    const updated = updateGuestDeckDraft(draft.id, { name: nameDraft });
    if (!updated) return;
    setDraft(updated);
    setNameDraft(updated.name);
  };

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
    const evaluation = evaluateDeckAdd(
      card,
      'skill',
      deckStateFromDraft(draft),
      draft.formatId,
      setIndex,
    );
    if (!evaluation.ok) {
      setSkillRefusalMessage(evaluation.message);
      return;
    }
    setSkillRefusalMessage(null);
    const next = updateGuestDeckDraft(draft.id, { skillId: skillCardId });
    if (next) setDraft(next);
  };

  const skillCard =
    draft.skillId != null ? (findCatalogCard(catalogCards, draft.skillId) ?? null) : null;
  const effectiveCap = genesysStatus?.cap ?? resolveGenesysPointCap(draft.genesysCap);

  const messageNode = message ? (
    <p
      className="text-sm text-heading"
      role={message.tone === 'refuse' ? 'alert' : 'status'}
      data-testid="deck-editor-message"
    >
      {message.text}
    </p>
  ) : null;

  const finder = (
    <CardFinder
      formatId={draft.formatId}
      setIndex={setIndex}
      query={query}
      onQueryChange={setQuery}
      filterState={filterState}
      onFilterStateChange={setFilterState}
      addTarget={addTarget}
      onAddTargetChange={setAddTarget}
      quantityForCard={(cardId) => deckCopyCount(cardId, listsFromDraft(draft))}
      onAdd={(card) => handleAddCard(card, addTarget)}
      onRemove={handleLibraryRemove}
      dragEnabled={desktop}
      onCardDragStart={(cardId) => {
        draggingCardId.current = cardId;
      }}
      filtersInSheet={!desktop}
      onFiltersVisibilityChange={(open) => {
        filtersOpenRef.current = open;
      }}
      autoFocusSearch={showLibraryInSheet}
    />
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      <div className="min-w-0 space-y-3">
        <Link
          to="/decks"
          className="text-sm font-medium text-heading underline-offset-2 hover:underline"
        >
          ← My decks
        </Link>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            commitName();
          }}
        >
          <label className="flex min-w-0 flex-col gap-1 text-sm text-text" htmlFor="deck-name">
            <span>Deck name</span>
            <input
              id="deck-name"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
              className="min-h-[var(--touch-min)] w-full rounded-md border border-border bg-bg px-3 text-2xl font-semibold text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            />
          </label>
        </form>
        <p className="text-sm text-text-2">{formatDisplayName(draft.formatId)}</p>
        <p className="text-sm tabular-nums text-text-2">
          Main {draft.main.length} / Extra {draft.extra.length} / Side {draft.side.length}
        </p>
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
              className={quietButtonClassName}
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

      {!showLibraryInSheet ? messageNode : null}

      <div
        className={
          desktop
            ? 'grid grid-cols-[minmax(22.5rem,25rem)_minmax(0,1fr)] items-start gap-4'
            : 'flex flex-col gap-4'
        }
      >
        {desktop ? (
          <div className="sticky top-16 flex max-h-[calc(100dvh-5rem)] min-h-0 flex-col overflow-y-auto rounded-md border border-border bg-surface p-3">
            {finder}
          </div>
        ) : null}
        <DeckZoneList
          formatId={draft.formatId}
          zones={{ main: draft.main, extra: draft.extra, side: draft.side }}
          cardsById={catalogById}
          dropEnabled={desktop}
          activeDropZone={activeDropZone}
          onDragOverZone={(zone, event) => {
            event.preventDefault();
            try {
              event.dataTransfer.dropEffect = 'copy';
            } catch {
              // Ignore when the transfer object is read-only.
            }
            setActiveDropZone(zone);
          }}
          onDragLeaveZone={(zone, event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && event.currentTarget.contains(next)) return;
            setActiveDropZone((current) => (current === zone ? null : current));
          }}
          onDropZone={handleDrop}
          onAddToZone={(zone, card) => handleAddCard(card, zone)}
          onRemoveFromZone={handleRemoveFromZone}
        />
      </div>

      {!desktop ? (
        <div className="sticky bottom-0 z-20 border-t border-border bg-bg py-3">
          <button
            type="button"
            className={primaryButtonClassName}
            onClick={() => setLibraryOpen(true)}
          >
            Add cards
          </button>
        </div>
      ) : null}

      {showLibraryInSheet ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-bg/80"
          role="presentation"
          onClick={() => setLibraryOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={libraryTitleId}
            className={`flex w-full flex-col border border-border bg-bg ${libraryExpanded ? 'h-full' : 'h-1/2'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <h2 id={libraryTitleId} className="text-base font-semibold text-heading">
                Add cards
              </h2>
              <button
                type="button"
                className={`${quietButtonClassName} ml-auto`}
                onClick={() => setLibraryExpanded((current) => !current)}
              >
                {libraryExpanded ? 'Half' : 'Full'}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border text-heading"
                aria-label="Close add cards"
                onClick={() => setLibraryOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
              {messageNode}
              {finder}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
