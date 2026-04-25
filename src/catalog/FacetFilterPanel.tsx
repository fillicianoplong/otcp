import type { ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { facetDefinitionsForGame, type FacetDefinition, type FacetFieldId } from './facets.ts';
import type { FacetGroupCounts, FilterEngine, FilterState } from './filterEngine.ts';
import { setFacetMatchMode, toggleExcludeValue, toggleIncludeValue } from './filterSelection.ts';

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

const COLLAPSED_OPTION_LIMIT = 10;

function groupDefinitions(definitions: readonly FacetDefinition[]): Map<string, FacetDefinition[]> {
  const map = new Map<string, FacetDefinition[]>();
  for (const def of definitions) {
    const list = map.get(def.group) ?? [];
    list.push(def);
    map.set(def.group, list);
  }
  return map;
}

function selectionForField(state: FilterState, fieldId: FacetFieldId) {
  return state.facets[fieldId];
}

type FacetFilterPanelProps = {
  engine: FilterEngine;
  filterState: FilterState;
  onChange: (next: FilterState) => void;
  searchIds?: readonly number[];
  className?: string;
};

export function FacetFilterPanel({
  engine,
  filterState,
  onChange,
  searchIds,
  className,
}: FacetFilterPanelProps) {
  const definitions = useMemo(() => facetDefinitionsForGame('yugioh'), []);
  const grouped = useMemo(() => groupDefinitions(definitions), [definitions]);
  const groupCounts = useMemo(
    () => engine.recount(filterState, searchIds ? { searchIds } : {}),
    [engine, filterState, searchIds],
  );
  const countsByField = useMemo(() => {
    const map = new Map<FacetFieldId, FacetGroupCounts>();
    for (const group of groupCounts) map.set(group.fieldId, group);
    return map;
  }, [groupCounts]);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (name: string) => {
    setCollapsedGroups((current) => ({ ...current, [name]: !current[name] }));
  };

  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">Filters</p>
      <div className="flex flex-col gap-4">
        {[...grouped.entries()].map(([groupName, fields]) => {
          const collapsed = collapsedGroups[groupName] ?? false;
          return (
            <section key={groupName} className="border-b border-border pb-4 last:border-b-0">
              <button
                type="button"
                className="flex w-full min-h-[var(--touch-min)] items-center justify-between text-left text-sm font-semibold text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
                aria-expanded={!collapsed}
                onClick={() => toggleGroup(groupName)}
              >
                {groupName}
                <span aria-hidden="true" className="text-text-2">
                  {collapsed ? '+' : '−'}
                </span>
              </button>
              {!collapsed ? (
                <div className="mt-2 flex flex-col gap-4">
                  {fields.map((def) => (
                    <FacetFieldBlock
                      key={def.id}
                      definition={def}
                      filterState={filterState}
                      counts={countsByField.get(def.id)}
                      engine={engine}
                      onChange={onChange}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FacetFieldBlock({
  definition,
  filterState,
  counts,
  engine,
  onChange,
}: {
  definition: FacetDefinition;
  filterState: FilterState;
  counts: FacetGroupCounts | undefined;
  engine: FilterEngine;
  onChange: (next: FilterState) => void;
}) {
  const selection = selectionForField(filterState, definition.id);
  const includeSet = new Set(selection?.include ?? []);
  const excludeSet = new Set(selection?.exclude ?? []);
  const mode = selection?.mode ?? 'or';

  if (definition.control === 'linkArrows') {
    const options = LINK_ARROW_VALUES.map((value) => ({
      value,
      count: counts ? engine.optionCount([counts], definition.id, value) : 0,
    }));
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
          onToggleInclude={(value) =>
            onChange(toggleIncludeValue(filterState, definition.id, value))
          }
          onToggleExclude={(value) =>
            onChange(toggleExcludeValue(filterState, definition.id, value))
          }
        />
      </FieldShell>
    );
  }

  const options =
    counts?.options
      .filter((opt) => opt.count > 0 || includeSet.has(opt.value) || excludeSet.has(opt.value))
      .sort((a, b) => a.value.localeCompare(b.value) || b.count - a.count) ?? [];

  if (definition.control === 'toggle') {
    const yes = options.find((opt) => opt.value === 'yes');
    const no = options.find((opt) => opt.value === 'no');
    return (
      <FieldShell definition={definition}>
        <div className="flex flex-col gap-1">
          {[yes, no].filter(Boolean).map((opt) => (
            <OptionRow
              key={opt!.value}
              label={opt!.value === 'yes' ? 'Yes' : 'No'}
              count={opt!.count}
              included={includeSet.has(opt!.value)}
              excluded={false}
              allowExclude={false}
              onToggleInclude={() =>
                onChange(toggleIncludeValue(filterState, definition.id, opt!.value))
              }
            />
          ))}
        </div>
      </FieldShell>
    );
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
        options={options.map((opt) => ({ value: opt.value, count: opt.count }))}
        includeSet={includeSet}
        excludeSet={excludeSet}
        onToggleInclude={(value) => onChange(toggleIncludeValue(filterState, definition.id, value))}
        onToggleExclude={(value) => onChange(toggleExcludeValue(filterState, definition.id, value))}
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
  onModeChange?: (next: FilterState) => void;
  filterState?: FilterState;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-heading">{definition.label}</p>
        {definition.allowAndOr && onModeChange && filterState ? (
          <div className="flex rounded-md border border-border text-xs">
            <button
              type="button"
              aria-pressed={mode !== 'and'}
              onClick={() => onModeChange(setFacetMatchMode(filterState, definition.id, 'or'))}
              className={`px-2 py-1 ${mode !== 'and' ? 'bg-surface-2 font-semibold text-heading' : 'text-text-2'}`}
            >
              OR
            </button>
            <button
              type="button"
              aria-pressed={mode === 'and'}
              onClick={() => onModeChange(setFacetMatchMode(filterState, definition.id, 'and'))}
              className={`px-2 py-1 ${mode === 'and' ? 'bg-surface-2 font-semibold text-heading' : 'text-text-2'}`}
            >
              AND
            </button>
          </div>
        ) : null}
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
  onToggleInclude,
  onToggleExclude,
}: {
  definition: FacetDefinition;
  options: readonly { value: string; count: number }[];
  includeSet: Set<string>;
  excludeSet: Set<string>;
  onToggleInclude: (value: string) => void;
  onToggleExclude: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const needsSearch = options.length > COLLAPSED_OPTION_LIMIT;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.value.toLowerCase().includes(q));
  }, [options, query]);
  const visible = expanded || !needsSearch ? filtered : filtered.slice(0, COLLAPSED_OPTION_LIMIT);

  return (
    <div className="flex flex-col gap-2">
      {needsSearch ? (
        <label className="sr-only" htmlFor={`facet-search-${definition.id}`}>
          Search {definition.label}
        </label>
      ) : null}
      {needsSearch ? (
        <input
          id={`facet-search-${definition.id}`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-text placeholder:text-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        />
      ) : null}
      <ul className="flex flex-col gap-1">
        {visible.map((opt) => (
          <li key={opt.value}>
            <OptionRow
              label={opt.value}
              count={opt.count}
              included={includeSet.has(opt.value)}
              excluded={excludeSet.has(opt.value)}
              allowExclude={definition.includeExclude}
              onToggleInclude={() => onToggleInclude(opt.value)}
              onToggleExclude={() => onToggleExclude(opt.value)}
            />
          </li>
        ))}
      </ul>
      {needsSearch && !expanded && filtered.length > COLLAPSED_OPTION_LIMIT ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-left text-sm text-text underline decoration-border underline-offset-2 hover:text-heading"
        >
          Show more ({filtered.length - COLLAPSED_OPTION_LIMIT})
        </button>
      ) : null}
    </div>
  );
}

function OptionRow({
  label,
  count,
  included,
  excluded,
  allowExclude,
  onToggleInclude,
  onToggleExclude,
}: {
  label: string;
  count: number;
  included: boolean;
  excluded: boolean;
  allowExclude: boolean;
  onToggleInclude: () => void;
  onToggleExclude?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex min-h-8 flex-1 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={included}
          onChange={() => onToggleInclude()}
          className="size-4 shrink-0 rounded border-border"
        />
        <span className={`truncate ${excluded ? 'line-through text-text-2' : 'text-text'}`}>
          {label}
        </span>
        <span className="ml-auto shrink-0 tabular-nums text-text-2">{count}</span>
      </label>
      {allowExclude && onToggleExclude ? (
        <button
          type="button"
          aria-pressed={excluded}
          title="Exclude"
          onClick={onToggleExclude}
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong ${
            excluded
              ? 'border-border-strong bg-surface-2 font-semibold text-heading'
              : 'border-border text-text-2 hover:text-text'
          }`}
        >
          Not
        </button>
      ) : null}
    </div>
  );
}

type PhoneFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  draftState: FilterState;
  onDraftChange: (next: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  resultCount: number;
  engine: FilterEngine;
  searchIds?: readonly number[];
};

export function PhoneFiltersSheet({
  open,
  onClose,
  draftState,
  onDraftChange,
  onApply,
  onReset,
  resultCount,
  engine,
  searchIds,
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

  const resultLabel = resultCount === 1 ? '1 result' : `${resultCount} results`;

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
          engine={engine}
          filterState={draftState}
          onChange={onDraftChange}
          searchIds={searchIds}
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
