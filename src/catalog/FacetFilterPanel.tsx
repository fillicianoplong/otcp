import type { ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  facetDefinitionsForGame,
  facetDisplayLabel,
  type FacetDefinition,
  type FacetFieldId,
} from './facets.ts';
import { formatFacetOptionLabel, sortFacetOptionsForDisplay } from './facetOptionOrdering.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type {
  FacetGroupCounts,
  FacetNumericRange,
  FilterState,
  FilterStateUpdater,
} from './filterEngine.ts';
import { cycleFacetValue, setFacetMatchMode, setFacetRange } from './filterSelection.ts';

const LINK_ARROW_VALUES = [
  'Top',
  'Bottom',
  'Left',
  'Right',
  'Top-Left',
  'Top-Right',
  'Bottom-Left',
  'Bottom-Right',
] as const;

const FACET_OPTIONS_INITIAL = 10;
const FACET_OPTIONS_PAGE = 20;
const FACET_OPTIONS_MAX = 50;

function selectionForField(state: FilterState, fieldId: FacetFieldId) {
  return state.facets[fieldId];
}

function optionCountForValue(counts: FacetGroupCounts | undefined, value: string): number {
  return counts?.options.find((opt) => opt.value === value)?.count ?? 0;
}

function facetHasActiveSelection(definition: FacetDefinition, filterState: FilterState): boolean {
  const selection = filterState.facets[definition.id];
  if (!selection) return false;
  return (
    (selection.include?.length ?? 0) > 0 ||
    (selection.exclude?.length ?? 0) > 0 ||
    selection.range?.min != null ||
    selection.range?.max != null ||
    (selection.mode === 'and' && definition.allowAndOr)
  );
}

function facetHasVisibleOptions(
  definition: FacetDefinition,
  counts: FacetGroupCounts | undefined,
  filterState: FilterState,
): boolean {
  if (facetHasActiveSelection(definition, filterState)) return true;

  if (definition.control === 'linkArrows') {
    return LINK_ARROW_VALUES.some((value) => optionCountForValue(counts, value) > 0);
  }

  const selection = filterState.facets[definition.id];
  const includeSet = new Set(selection?.include ?? []);
  const excludeSet = new Set(selection?.exclude ?? []);
  const options =
    counts?.options.filter(
      (opt) => opt.count > 0 || includeSet.has(opt.value) || excludeSet.has(opt.value),
    ) ?? [];
  return options.length > 0;
}

function rangeBucketLabel(value: string): string {
  if (value === '?') return '?';
  if (value === '0') return '0';
  if (value === '3001+') return '3001+';
  return value.replace('-', '–');
}

function parseRangeInput(raw: string, allowDecimals: boolean): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = allowDecimals ? Number(trimmed) : Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function FacetCustomRangeInputs({
  fieldId,
  range,
  allowDecimals,
  onApply,
}: {
  fieldId: FacetFieldId;
  range: FacetNumericRange | undefined;
  allowDecimals: boolean;
  onApply: (range: FacetNumericRange | undefined) => void;
}) {
  const [minDraft, setMinDraft] = useState(() => (range?.min != null ? String(range.min) : ''));
  const [maxDraft, setMaxDraft] = useState(() => (range?.max != null ? String(range.max) : ''));

  const commit = () => {
    const min = parseRangeInput(minDraft, allowDecimals);
    const max = parseRangeInput(maxDraft, allowDecimals);
    if (min != null && max != null && min > max) {
      onApply({ min: max, max: min });
      setMinDraft(String(Math.min(min, max)));
      setMaxDraft(String(Math.max(min, max)));
      return;
    }
    if (min == null && max == null) {
      onApply(undefined);
      return;
    }
    onApply({ min, max });
  };

  const inputClassName =
    'w-full min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

  return (
    <div className="mb-3 flex flex-col gap-2">
      <span className="text-xs text-text-2">Custom range</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Min
          <input
            type="number"
            inputMode={allowDecimals ? 'decimal' : 'numeric'}
            step={allowDecimals ? '0.01' : '1'}
            value={minDraft}
            onChange={(event) => setMinDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
            }}
            aria-label={`${fieldId} minimum`}
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Max
          <input
            type="number"
            inputMode={allowDecimals ? 'decimal' : 'numeric'}
            step={allowDecimals ? '0.01' : '1'}
            value={maxDraft}
            onChange={(event) => setMaxDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
            }}
            aria-label={`${fieldId} maximum`}
            className={inputClassName}
          />
        </label>
      </div>
    </div>
  );
}

type FacetFilterPanelProps = {
  filterState: FilterState;
  groupCounts: readonly FacetGroupCounts[];
  catalogFieldIds: readonly FacetFieldId[];
  onChange: (next: FilterStateUpdater) => void;
  className?: string;
  setIndex?: SetIndex | null;
};

export function FacetFilterPanel({
  filterState,
  groupCounts,
  catalogFieldIds,
  onChange,
  className,
  setIndex,
}: FacetFilterPanelProps) {
  const definitions = useMemo(() => facetDefinitionsForGame('yugioh'), []);
  const countsByField = useMemo(() => {
    const map = new Map<FacetFieldId, FacetGroupCounts>();
    for (const group of groupCounts) map.set(group.fieldId, group);
    return map;
  }, [groupCounts]);

  const [collapsedFields, setCollapsedFields] = useState<Record<string, boolean>>({});
  const toggleField = (fieldId: string) => {
    setCollapsedFields((current) => ({ ...current, [fieldId]: !current[fieldId] }));
  };

  const catalogIdSet = useMemo(() => new Set(catalogFieldIds), [catalogFieldIds]);

  const visibleDefinitions = useMemo(() => {
    const byId = new Map(definitions.map((def) => [def.id, def]));
    const ordered: FacetDefinition[] = [];
    for (const id of catalogFieldIds) {
      const def = byId.get(id);
      if (def) ordered.push(def);
    }
    for (const def of definitions) {
      if (
        !catalogIdSet.has(def.id) &&
        facetHasVisibleOptions(def, countsByField.get(def.id), filterState)
      ) {
        ordered.push(def);
      }
    }
    return ordered;
  }, [catalogFieldIds, catalogIdSet, countsByField, definitions, filterState]);

  return (
    <div className={className}>
      <h2 className="mb-3 text-base font-semibold text-heading">Filters</h2>
      <div className="flex flex-col gap-3">
        {visibleDefinitions.map((def) => {
          const collapsed = collapsedFields[def.id] ?? false;
          return (
            <FacetFieldCard
              key={def.id}
              definition={def}
              title={facetDisplayLabel(def)}
              collapsed={collapsed}
              onToggleCollapse={() => toggleField(def.id)}
              filterState={filterState}
              counts={countsByField.get(def.id)}
              onChange={onChange}
              setIndex={setIndex}
            />
          );
        })}
      </div>
    </div>
  );
}

function FacetFieldCard({
  definition,
  title,
  collapsed,
  onToggleCollapse,
  filterState,
  counts,
  onChange,
  setIndex,
}: {
  definition: FacetDefinition;
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  filterState: FilterState;
  counts: FacetGroupCounts | undefined;
  onChange: (next: FilterStateUpdater) => void;
  setIndex?: SetIndex | null;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between gap-2 bg-surface-2 px-3 py-2 text-left text-sm font-medium text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong"
        aria-expanded={!collapsed}
        onClick={onToggleCollapse}
      >
        <span className="min-w-0 truncate">{title}</span>
        <span aria-hidden="true" className="shrink-0 text-text-2">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>
      {!collapsed ? (
        <div className="px-3 py-3">
          <FacetFieldBlock
            definition={definition}
            filterState={filterState}
            counts={counts}
            onChange={onChange}
            setIndex={setIndex}
          />
        </div>
      ) : null}
    </section>
  );
}

function FacetFieldBlock({
  definition,
  filterState,
  counts,
  onChange,
  setIndex,
}: {
  definition: FacetDefinition;
  filterState: FilterState;
  counts: FacetGroupCounts | undefined;
  onChange: (next: FilterStateUpdater) => void;
  setIndex?: SetIndex | null;
}) {
  const selection = selectionForField(filterState, definition.id);
  const includeSet = new Set(selection?.include ?? []);
  const excludeSet = new Set(selection?.exclude ?? []);
  const mode = selection?.mode ?? 'or';

  if (definition.control === 'priceRange') {
    return (
      <FacetCustomRangeInputs
        key={`${selection?.range?.min ?? 'x'}-${selection?.range?.max ?? 'x'}`}
        fieldId={definition.id}
        range={selection?.range}
        allowDecimals
        onApply={(nextRange) => onChange((state) => setFacetRange(state, definition.id, nextRange))}
      />
    );
  }

  if (definition.control === 'linkArrows') {
    const options = LINK_ARROW_VALUES.map((value) => ({
      value,
      count: optionCountForValue(counts, value),
    }));
    const hasAny =
      options.some((opt) => opt.count > 0) ||
      LINK_ARROW_VALUES.some((value) => includeSet.has(value) || excludeSet.has(value));
    if (!hasAny) {
      return <p className="text-sm text-text-2">No values</p>;
    }
    return (
      <FieldShell
        definition={definition}
        mode={mode}
        onModeChange={onChange}
        filterState={filterState}
      >
        <OptionList
          definition={definition}
          options={options}
          includeSet={includeSet}
          excludeSet={excludeSet}
          onCycle={(value) =>
            onChange((state) =>
              cycleFacetValue(state, definition.id, value, definition.includeExclude),
            )
          }
        />
      </FieldShell>
    );
  }

  const options =
    counts?.options.filter(
      (opt) => opt.count > 0 || includeSet.has(opt.value) || excludeSet.has(opt.value),
    ) ?? [];

  if (options.length === 0 && definition.control !== 'range') {
    return <p className="text-sm text-text-2">No values</p>;
  }

  if (definition.control === 'toggle') {
    const yes = options.find((opt) => opt.value === 'yes');
    const no = options.find((opt) => opt.value === 'no');
    return (
      <FieldShell definition={definition}>
        <div className="flex flex-col gap-0.5">
          {[yes, no].filter(Boolean).map((opt) => (
            <OptionRow
              key={opt!.value}
              label={opt!.value === 'yes' ? 'Yes' : 'No'}
              count={opt!.count}
              included={includeSet.has(opt!.value)}
              excluded={false}
              allowExclude={false}
              onCycle={() =>
                onChange((state) => cycleFacetValue(state, definition.id, opt!.value, false))
              }
            />
          ))}
        </div>
      </FieldShell>
    );
  }

  const displayOptions = sortFacetOptionsForDisplay(
    definition.id,
    options.map((opt) => ({
      value: opt.value,
      count: opt.count,
      label:
        definition.control === 'range'
          ? definition.id === 'level'
            ? formatFacetOptionLabel(definition.id, opt.value)
            : rangeBucketLabel(opt.value)
          : undefined,
    })),
    definition.id === 'set' ? { setIndex } : undefined,
  );

  const preserveOptionOrder =
    definition.id === 'set' ||
    definition.control === 'range' ||
    definition.id === 'level' ||
    definition.id === 'atk' ||
    definition.id === 'def';

  const rangeBlock =
    definition.control === 'range' ? (
      <FacetCustomRangeInputs
        key={`${selection?.range?.min ?? 'x'}-${selection?.range?.max ?? 'x'}`}
        fieldId={definition.id}
        range={selection?.range}
        allowDecimals={definition.id === 'price'}
        onApply={(nextRange) => onChange((state) => setFacetRange(state, definition.id, nextRange))}
      />
    ) : null;

  if (definition.control === 'range' && displayOptions.length === 0) {
    return (
      <>
        {rangeBlock}
        <p className="text-sm text-text-2">No values</p>
      </>
    );
  }

  return (
    <FieldShell
      definition={definition}
      mode={mode}
      onModeChange={onChange}
      filterState={filterState}
    >
      {rangeBlock}
      <OptionList
        definition={definition}
        options={displayOptions}
        includeSet={includeSet}
        excludeSet={excludeSet}
        preserveOptionOrder={preserveOptionOrder}
        onCycle={(value) =>
          onChange((state) =>
            cycleFacetValue(state, definition.id, value, definition.includeExclude),
          )
        }
      />
    </FieldShell>
  );
}

function FieldShell({
  definition,
  children,
  mode,
  onModeChange,
  filterState,
}: {
  definition: FacetDefinition;
  children: ReactNode;
  mode?: 'or' | 'and';
  onModeChange?: (next: FilterStateUpdater) => void;
  filterState?: FilterState;
}) {
  const showAndOr = definition.allowAndOr && onModeChange && filterState;
  if (!showAndOr) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
        <div className="flex rounded-md border border-border text-xs">
          <button
            type="button"
            aria-pressed={mode !== 'and'}
            onClick={() => onModeChange((state) => setFacetMatchMode(state, definition.id, 'or'))}
            className={`px-2 py-1 ${mode !== 'and' ? 'bg-surface-2 font-semibold text-heading' : 'text-text-2'}`}
          >
            OR
          </button>
          <button
            type="button"
            aria-pressed={mode === 'and'}
            onClick={() => onModeChange((state) => setFacetMatchMode(state, definition.id, 'and'))}
            className={`px-2 py-1 ${mode === 'and' ? 'bg-surface-2 font-semibold text-heading' : 'text-text-2'}`}
          >
            AND
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function OptionList({
  definition,
  options,
  includeSet,
  excludeSet,
  preserveOptionOrder,
  onCycle,
}: {
  definition: FacetDefinition;
  options: readonly { value: string; count: number; label?: string }[];
  includeSet: Set<string>;
  excludeSet: Set<string>;
  preserveOptionOrder?: boolean;
  onCycle: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(FACET_OPTIONS_INITIAL);
  const needsPaging = options.length > FACET_OPTIONS_INITIAL;
  const facetLabel = facetDisplayLabel(definition);
  const searchPlaceholder = definition.id === 'set' ? 'Search within…' : `Search ${facetLabel}…`;

  const sortedOptions = useMemo(() => {
    if (preserveOptionOrder) return options;
    return [...options].sort(
      (a, b) => b.count - a.count || (a.label ?? a.value).localeCompare(b.label ?? b.value),
    );
  }, [options, preserveOptionOrder]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedOptions;
    return sortedOptions.filter((opt) => {
      const label = (opt.label ?? opt.value).toLowerCase();
      return label.includes(q) || opt.value.toLowerCase().includes(q);
    });
  }, [query, sortedOptions]);

  const displayCap = Math.min(filtered.length, FACET_OPTIONS_MAX);
  const visibleCount = needsPaging ? Math.min(visibleLimit, displayCap) : filtered.length;
  const visible = filtered.slice(0, visibleCount);
  const canShowMore = needsPaging && visibleCount < displayCap;

  const listScrollable = needsPaging || visible.length > FACET_OPTIONS_INITIAL;

  return (
    <div className="flex flex-col gap-2">
      {needsPaging ? (
        <>
          <label className="sr-only" htmlFor={`facet-search-${definition.id}`}>
            Search {facetLabel}
          </label>
          <input
            id={`facet-search-${definition.id}`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleLimit(FACET_OPTIONS_INITIAL);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          />
        </>
      ) : null}
      <div className={listScrollable ? 'max-h-[320px] overflow-y-auto pr-1' : undefined}>
        <ul className="flex flex-col gap-0.5">
          {visible.map((opt) => (
            <li key={opt.value}>
              <OptionRow
                label={opt.label ?? opt.value}
                count={opt.count}
                included={includeSet.has(opt.value)}
                excluded={excludeSet.has(opt.value)}
                allowExclude={definition.includeExclude}
                onCycle={() => onCycle(opt.value)}
              />
            </li>
          ))}
        </ul>
      </div>
      {canShowMore ? (
        <button
          type="button"
          onClick={() =>
            setVisibleLimit((current) =>
              Math.min(current + FACET_OPTIONS_PAGE, FACET_OPTIONS_MAX, filtered.length),
            )
          }
          className="text-left text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
        >
          Show more
        </button>
      ) : null}
    </div>
  );
}

function triStateLabel(label: string, included: boolean, excluded: boolean): string {
  if (included) return `Include ${label}`;
  if (excluded) return `Exclude ${label}`;
  return `Include ${label}`;
}

function OptionRow({
  label,
  count,
  included,
  excluded,
  allowExclude,
  onCycle,
}: {
  label: string;
  count: number;
  included: boolean;
  excluded: boolean;
  allowExclude: boolean;
  onCycle: () => void;
}) {
  const ariaChecked = included ? true : excluded ? 'mixed' : false;
  const ariaLabel = triStateLabel(label, included, excluded);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      onClick={onCycle}
      className={`flex min-h-8 w-full items-center gap-2 rounded-sm text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong ${
        excluded ? 'text-text-2' : 'text-text'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex size-4 shrink-0 items-center justify-center rounded border ${
          excluded
            ? 'border-border-strong bg-surface-2 text-heading'
            : included
              ? 'border-border-strong bg-heading text-on-accent'
              : 'border-border bg-surface'
        }`}
      >
        {included ? (
          <svg viewBox="0 0 12 12" className="size-3">
            <path
              d="M2 6.5 4.5 9 10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : excluded && allowExclude ? (
          <svg viewBox="0 0 12 12" className="size-3">
            <path
              d="M3 6h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </span>
      <span className={`truncate ${excluded ? 'line-through' : ''}`}>{label}</span>
      <span className="ml-auto shrink-0 tabular-nums text-text-2">{count}</span>
    </button>
  );
}

type PhoneFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  draftState: FilterState;
  onDraftChange: (next: FilterStateUpdater) => void;
  onApply: () => void;
  onReset: () => void;
  resultCount: number;
  draftGroupCounts: readonly FacetGroupCounts[];
  catalogFieldIds: readonly FacetFieldId[];
  setIndex?: SetIndex | null;
};

export function PhoneFiltersSheet({
  open,
  onClose,
  draftState,
  onDraftChange,
  onApply,
  onReset,
  resultCount,
  draftGroupCounts,
  catalogFieldIds,
  setIndex,
}: PhoneFiltersSheetProps) {
  const titleId = useId().replace(/:/g, '');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const resultLabel = resultCount === 1 ? '1 result' : `${resultCount.toLocaleString()} results`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[var(--touch-min)] min-w-[var(--touch-min)] items-center justify-center rounded-md border border-border text-heading"
          aria-label="Close filters"
        >
          ×
        </button>
        <h2 id={titleId} className="text-lg font-semibold text-heading">
          Filters
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
        >
          Reset
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <FacetFilterPanel
          filterState={draftState}
          groupCounts={draftGroupCounts}
          catalogFieldIds={catalogFieldIds}
          onChange={onDraftChange}
          setIndex={setIndex}
        />
      </div>
      <footer className="border-t border-border p-4">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex min-h-[var(--touch-min)] w-full items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-base font-medium text-on-accent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          See {resultLabel}
        </button>
      </footer>
    </div>
  );
}
