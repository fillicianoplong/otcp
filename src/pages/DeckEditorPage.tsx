import { Navigate, useParams } from 'react-router';
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react';

import { CardFinder } from '../cardFinder/CardFinder.tsx';
import { CardFinderViewToggle } from '../cardFinder/CardFinderViewToggle.tsx';
import { LIBRARY_GRID_COLUMNS, LIBRARY_SHEET_COLUMNS } from '../cardFinder/libraryGrid.ts';
import { catalogSmallImageUrl } from '../catalog/cardArt.ts';
import { getGuestDeckDraft, updateGuestDeckDraft } from '../deckStore/guestDeckDraftStore.ts';
import type { GuestDeckDraft, GuestDeckDraftUpdate } from '../deckStore/types.ts';
import { DeckZoneList } from '../deckEditor/DeckZoneList.tsx';
import { DECK_EDITOR_SPLIT_MIN_PX } from '../deckEditor/deckEditorLayout.ts';
import { DeckInteractionProvider } from '../deckEditor/deckInteraction.tsx';
import { readDropTarget, type DeckDropTarget } from '../deckEditor/deckInteractionContext.ts';
import {
  addCardToDeck,
  deckCopyCount,
  deckZoneLabel,
  moveCardBetweenZones,
  readDeckDrag,
  removeOneCardFromZone,
  removeOneLibraryCopy,
  type DeckAddTarget,
  type DeckCardLists,
  type DeckDragPayload,
  type DeckZone,
} from '../deckEditor/deckPlacement.ts';
import { deckListColumnCount } from '../deckEditor/deckTileSize.ts';
import {
  readDeckZoneSortMode,
  writeDeckZoneSortMode,
  type DeckZoneSortMode,
} from '../deckEditor/deckZoneSort.ts';
import {
  readDeckZoneViewMode,
  writeDeckZoneViewMode,
  type DeckZoneViewMode,
} from '../deckEditor/deckZoneView.ts';
import { useCardCatalog } from '../catalog/useCardCatalog.ts';
import { emptyFilterState, type FilterState } from '../catalog/filterEngine.ts';
import {
  evaluateGenesysDeckPoints,
  isGenesysFormat,
  resolveGenesysPointCap,
} from '../format/formatEngine/genesysRules.ts';
import { evaluateDeckAdd, type DeckListState } from '../format/formatEngine.ts';
import type { FormatId } from '../format/formatCatalog.ts';
import { useMinViewportWidth } from '../hooks/useMinViewportWidth.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { SortSelect } from '../ui/SortSelect.tsx';
import { Toolbar } from '../ui/Toolbar.tsx';
import type { YugiohCard } from '../shared/schema/card.ts';

const panelClassName = 'rounded-md border border-border bg-surface p-4';

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
        <Input
          field="inset"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="100"
          value={capInput}
          onChange={(event) => onCapInputChange(event.target.value)}
          className="max-w-[8rem] text-heading"
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
  const [zoneView, setZoneView] = useState<DeckZoneViewMode>(() => readDeckZoneViewMode());
  const [zoneSort, setZoneSort] = useState<DeckZoneSortMode>(() => readDeckZoneSortMode());
  const chooseZoneView = (mode: DeckZoneViewMode) => {
    setZoneView(mode);
    writeDeckZoneViewMode(mode);
  };
  const chooseZoneSort = (mode: DeckZoneSortMode) => {
    setZoneSort(mode);
    writeDeckZoneSortMode(mode);
  };
  const [capInput, setCapInput] = useState(() =>
    initialDraft?.genesysCap != null ? String(initialDraft.genesysCap) : '',
  );
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(() => emptyFilterState());
  const [message, setMessage] = useState<{ tone: 'ok' | 'refuse'; text: string } | null>(null);
  const [skillRefusalMessage, setSkillRefusalMessage] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [activeDropZone, setActiveDropZone] = useState<DeckZone | null>(null);
  const [highlight, setHighlight] = useState<DeckDropTarget | null>(null);
  const [tileSizePx, setTileSizePx] = useState(0);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<DeckZone | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<DeckDragPayload | null>(null);
  const helpId = useId();
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
    const result = removeOneLibraryCopy(card, 'auto', listsFromDraft(draft));
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

  const deckColumns = deckListColumnCount(desktop ? DECK_EDITOR_SPLIT_MIN_PX : 0);

  const finishDrop = (payload: DeckDragPayload | null, target: DeckDropTarget | null) => {
    dragging.current = null;
    setHighlight(null);
    setActiveDropZone(null);
    if (ghostRef.current) ghostRef.current.hidden = true;
    if (!payload || !draft) return;
    const card = catalogById.get(payload.cardId);
    if (!card) {
      setMessage({ tone: 'refuse', text: 'That card is not in the loaded catalog.' });
      return;
    }
    const lists = listsFromDraft(draft);
    if (payload.from === 'library') {
      if (target === 'main' || target === 'extra' || target === 'side') {
        handleAddCard(card, target);
      }
      return;
    }
    if (target === 'main' || target === 'extra' || target === 'side') {
      const moved = moveCardBetweenZones(
        card,
        payload.from,
        target,
        draft.formatId,
        lists,
        setIndex,
      );
      if (!moved.ok) {
        setMessage({ tone: 'refuse', text: moved.message });
        return;
      }
      if (target !== payload.from) persistLists(moved.lists, moved.message, 'ok');
      return;
    }
    handleRemoveFromZone(payload.from, payload.cardId);
  };

  const handleDrop = (zone: DeckZone, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDeckDrag(event.dataTransfer, dragging.current);
    finishDrop(payload, zone);
  };

  const placeGhost = (x: number, y: number, cardId: number) => {
    const node = ghostRef.current;
    if (!node) return;
    const img = node.querySelector('img');
    const label = node.querySelector('span');
    const card = catalogById.get(cardId);
    if (img instanceof HTMLImageElement && img.dataset.cardId !== String(cardId)) {
      img.dataset.cardId = String(cardId);
      img.alt = '';
      if (card) img.src = catalogSmallImageUrl(card, card.id);
      img.hidden = false;
      if (label) label.hidden = true;
    }
    if (label && card) label.textContent = card.name;
    node.hidden = false;
    const width = node.offsetWidth || tileSizePx || 72;
    node.style.left = `${Math.max(8, x - width / 2)}px`;
    node.style.top = `${Math.max(8, y - 28)}px`;
  };

  const applyDropEffect = (event: DragEvent, payload: DeckDragPayload | null) => {
    try {
      event.dataTransfer.dropEffect = payload?.from === 'library' ? 'copy' : 'move';
    } catch {
      // Ignore when the transfer object is read-only.
    }
  };

  const onEditorDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    placeGhost(event.clientX, event.clientY, dragging.current.cardId);
    const target = readDropTarget(event.target);
    if (target) {
      event.preventDefault();
      applyDropEffect(event, dragging.current);
      setHighlight(target);
      if (target === 'main' || target === 'extra' || target === 'side') setActiveDropZone(target);
      return;
    }
    if (dragging.current.from !== 'library') {
      event.preventDefault();
      applyDropEffect(event, dragging.current);
      setHighlight('away');
    }
  };

  const onEditorDrop = (event: DragEvent<HTMLDivElement>) => {
    const payload = readDeckDrag(event.dataTransfer, dragging.current);
    const target = readDropTarget(event.target);
    if (target === 'main' || target === 'extra' || target === 'side') return;
    event.preventDefault();
    finishDrop(payload, target ?? (payload && payload.from !== 'library' ? 'away' : null));
  };

  const selectTile = (id: string, zone: DeckZone | null) => {
    setSelectedTileId(id);
    if (zone) setActiveZone(zone);
  };

  const clearTileSelection = () => {
    setSelectedTileId(null);
    setActiveZone(null);
  };

  const onPhoneAdd = (payload: DeckDragPayload) => {
    const card = catalogById.get(payload.cardId);
    if (!card) return;
    handleAddCard(card, payload.from === 'library' ? (activeZone ?? 'auto') : payload.from);
  };

  const onPhoneRemove = (payload: DeckDragPayload) => {
    const card = catalogById.get(payload.cardId);
    if (!card) return;
    if (payload.from === 'library') {
      handleLibraryRemove(card);
      return;
    }
    handleRemoveFromZone(payload.from, payload.cardId);
  };

  const onKeyAction = (payload: DeckDragPayload, action: 'add' | 'remove' | DeckZone) => {
    const card = catalogById.get(payload.cardId);
    if (!card || !draft) return;
    if (action === 'add') {
      handleAddCard(card, 'auto');
      return;
    }
    if (payload.from === 'library') {
      if (action === 'main' || action === 'extra' || action === 'side') handleAddCard(card, action);
      return;
    }
    if (action === 'remove') {
      handleRemoveFromZone(payload.from, payload.cardId);
      return;
    }
    if (action === 'main' || action === 'extra' || action === 'side') {
      const moved = moveCardBetweenZones(
        card,
        payload.from,
        action,
        draft.formatId,
        listsFromDraft(draft),
        setIndex,
      );
      if (!moved.ok) {
        setMessage({ tone: 'refuse', text: moved.message });
        return;
      }
      if (action !== payload.from) persistLists(moved.lists, moved.message, 'ok');
    }
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
      quantityForCard={(cardId) => deckCopyCount(cardId, listsFromDraft(draft))}
      onAdd={(card) => handleAddCard(card, activeZone ?? 'auto')}
      onRemove={handleLibraryRemove}
      dragEnabled={desktop}
      dropActive={highlight === 'library'}
      preferredColumns={desktop ? LIBRARY_GRID_COLUMNS : LIBRARY_SHEET_COLUMNS}
      onCardDragStart={(cardId) => {
        dragging.current = { cardId, from: 'library' };
      }}
      filtersInSheet={!desktop}
      onFiltersVisibilityChange={(open) => {
        filtersOpenRef.current = open;
      }}
      onFormatChange={handleFormatChange}
      autoFocusSearch={showLibraryInSheet}
    />
  );

  return (
    <DeckInteractionProvider
      value={{
        tileSizePx,
        helpId,
        phoneControls: !desktop,
        selectedTileId,
        selectTile,
        onPhoneAdd,
        onPhoneRemove,
        copyCount: (cardId) => deckCopyCount(cardId, listsFromDraft(draft)),
        onDragPayload: (payload) => {
          dragging.current = payload;
        },
        onKeyAction,
        onTouchDrag: (phase, point, payload) => {
          dragging.current = payload;
          if (phase === 'move' && point) {
            placeGhost(point.x, point.y, payload.cardId);
            const hit = document.elementFromPoint(point.x, point.y);
            const target = readDropTarget(hit);
            setHighlight(target ?? (payload.from === 'library' ? null : 'away'));
            return;
          }
          const hit = point ? document.elementFromPoint(point.x, point.y) : null;
          const target = readDropTarget(hit);
          finishDrop(payload, target ?? (payload.from === 'library' ? null : 'away'));
        },
      }}
    >
      <PageContainer
        className="flex flex-col gap-4 overflow-x-hidden"
        onClick={(event) => {
          if (!(event.target instanceof Element)) return;
          if (event.target.closest('[data-tile-root]')) return;
          if (selectedTileId) clearTileSelection();
        }}
        onDragOver={onEditorDragOver}
        onDrop={onEditorDrop}
        onDragEnd={() => {
          setHighlight(null);
          setActiveDropZone(null);
          if (ghostRef.current) ghostRef.current.hidden = true;
        }}
      >
        <p id={helpId} className="sr-only">
          Drag a card from search into Main, Extra, or Side to add it. Drag a deck card to another
          section to move it, or onto search or empty space to take one copy out. On a focused
          search card, Enter adds an Extra Deck monster to Extra and any other card to Main. On a
          phone, tap a card to show add and remove. On a focused deck card, Delete removes it and M,
          E, or S moves it.
        </p>
        <div className="min-w-0 space-y-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              commitName();
            }}
          >
            <Input
              id="deck-name"
              field="title"
              aria-label="Deck name"
              placeholder="Deck name"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
            />
          </form>
          <Toolbar
            actions={
              <>
                <SortSelect
                  id="deck-zone-sort"
                  label="Sort deck"
                  value={zoneSort}
                  onChange={chooseZoneSort}
                  options={[
                    { value: 'type', label: 'Type' },
                    { value: 'name', label: 'Name' },
                    { value: 'added', label: 'Added' },
                  ]}
                />
                <CardFinderViewToggle
                  value={zoneView}
                  onChange={chooseZoneView}
                  groupLabel="Deck view"
                  listLabel="Deck list view"
                  gridLabel="Deck grid view"
                />
              </>
            }
          />
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
            <SectionHeader id="skill-heading">Skill card</SectionHeader>
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
              <Button variant="primary" onClick={() => trySetSkill(SAMPLE_SKILL_IDS.heroesUnite)}>
                Set HEROES UNITE - FUSION!!
              </Button>
              <Button onClick={() => trySetSkill(SAMPLE_SKILL_IDS.ancientFusion)}>
                Set Ancient Fusion
              </Button>
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
              ? 'grid grid-cols-[18rem_minmax(0,1fr)] items-start gap-4'
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
              applyDropEffect(event, dragging.current);
              if (dragging.current)
                placeGhost(event.clientX, event.clientY, dragging.current.cardId);
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
            columns={deckColumns}
            tileSizePx={tileSizePx}
            highlight={highlight}
            onTileSize={setTileSizePx}
            viewMode={zoneView}
            sortMode={zoneSort}
          />
        </div>

        {!desktop ? (
          <div className="sticky bottom-0 z-20 border-t border-border bg-bg py-3">
            <Button variant="primary" fullWidth onClick={() => setLibraryOpen(true)}>
              Add cards
            </Button>
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
                <SectionHeader id={libraryTitleId}>Add cards</SectionHeader>
                <Button
                  className="ml-auto"
                  onClick={() => setLibraryExpanded((current) => !current)}
                >
                  {libraryExpanded ? 'Half' : 'Full'}
                </Button>
                <Button
                  variant="icon"
                  aria-label="Close add cards"
                  onClick={() => setLibraryOpen(false)}
                >
                  ×
                </Button>
              </header>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                {messageNode}
                {finder}
              </div>
            </div>
          </div>
        ) : null}
        <div
          ref={ghostRef}
          hidden
          data-drag-ghost
          className="pointer-events-none fixed z-[60] overflow-hidden rounded-sm border border-border-strong bg-surface"
          style={{ width: tileSizePx > 0 ? tileSizePx : 72 }}
        >
          <img
            alt=""
            className="pointer-events-none aspect-card w-full object-contain"
            onError={(event) => {
              event.currentTarget.hidden = true;
              const label = event.currentTarget.nextElementSibling;
              if (label instanceof HTMLElement) label.hidden = false;
            }}
          />
          <span
            hidden
            className="flex aspect-card w-full items-center justify-center px-1 text-center text-2xs leading-tight text-heading"
          />
        </div>
      </PageContainer>
    </DeckInteractionProvider>
  );
}
