import { useEffect, useId, useState } from 'react';

import { CatalogViewToggle } from '../catalog/CatalogViewToggle.tsx';
import type { CatalogViewMode } from '../catalog/catalogViewMode.ts';
import { Button } from '../ui/Button.tsx';
import { CollapsibleSection } from '../ui/CollapsibleSection.tsx';
import { CardGrid } from '../ui/CardGrid.tsx';
import { CardTileFrame } from '../ui/CardTile.tsx';
import { Chip } from '../ui/Chip.tsx';
import { Combobox, type ComboboxOption } from '../ui/Combobox.tsx';
import { Input } from '../ui/Input.tsx';
import { ListThumb } from '../ui/ListRow.tsx';
import { Menu } from '../ui/Menu.tsx';
import { PageContainer } from '../ui/PageContainer.tsx';
import { PageTitle } from '../ui/PageTitle.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { TableToolbar } from '../ui/TableToolbar.tsx';
import { SearchIcon, ToolbarIconButton } from '../ui/ToolbarIconButton.tsx';
import { Toolbar } from '../ui/Toolbar.tsx';
import {
  listRowLinkClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableWrapClass,
} from '../ui/classes.ts';
import {
  defaultTableColumnVisibility,
  isTableColumnVisible,
  type TableColumn,
  type TableColumnVisibility,
} from '../ui/tableColumns.ts';

const TYPE_STEPS = [
  ['text-2xs', '2xs · 10px'],
  ['text-xs', 'xs · 11px'],
  ['text-sm', 'sm · 13px'],
  ['text-base', 'base · 15px'],
  ['text-lg', 'lg · 18px'],
  ['text-xl', 'xl · 21px'],
  ['text-2xl', '2xl · 24px'],
] as const;

const SPACE_STEPS = [
  ['1', '4px'],
  ['2', '8px'],
  ['3', '12px'],
  ['4', '16px'],
  ['5', '24px'],
  ['6', '32px'],
  ['7', '40px'],
  ['8', '48px'],
] as const;

const RADIUS_STEPS = [
  ['rounded-sm', 'sm · 4px'],
  ['rounded-md', 'md · 8px'],
  ['rounded-lg', 'lg · 12px'],
  ['rounded-full', 'pill'],
] as const;

const SWATCHES = [
  ['bg', 'Page'],
  ['surface', 'Surface'],
  ['surface-2', 'Surface 2'],
  ['text', 'Text'],
  ['text-2', 'Text 2'],
  ['heading', 'Heading'],
  ['border', 'Border'],
  ['border-strong', 'Border strong'],
  ['accent', 'Accent'],
] as const;

const DEMO_OPTIONS: ComboboxOption[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
];

const TABLE_COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'type', label: 'Type' },
  { id: 'attribute', label: 'Attribute' },
  { id: 'atk', label: 'ATK' },
];

const TABLE_CELLS: Record<string, string> = {
  name: 'Dark Magician',
  type: 'Normal Monster',
  attribute: 'DARK',
  atk: '2500',
};

function TokenSwatch({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="size-8 rounded-sm border border-border"
        style={{ background: `var(--color-${name})` }}
      />
      <span className="text-sm text-text">
        {label}
        <span className="block text-xs text-text-2">--color-{name}</span>
      </span>
    </div>
  );
}

function PlaceholderTile({ label }: { label: string }) {
  return (
    <li>
      <div className="block rounded-sm">
        <CardTileFrame>
          <div className="flex aspect-card w-full items-center justify-center bg-surface-2 text-2xs text-text-2">
            {label}
          </div>
        </CardTileFrame>
      </div>
    </li>
  );
}

function DemoCombobox({ openByDefault }: { openByDefault: boolean }) {
  const rawId = useId().replace(/:/g, '');
  const [open, setOpen] = useState(openByDefault);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('alpha');
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = DEMO_OPTIONS.find((option) => option.id === selectedId);
  const options = DEMO_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Combobox
      label={openByDefault ? 'Open combobox' : 'Closed combobox'}
      inputId={`${rawId}-input`}
      listId={`${rawId}-list`}
      open={open}
      query={query}
      valueLabel={selected?.label ?? ''}
      placeholder="Search"
      options={options}
      activeIndex={Math.min(activeIndex, Math.max(options.length - 1, 0))}
      selectedId={selectedId}
      emptyMessage="No matches."
      optionDomId={(id) => `${rawId}-opt-${id}`}
      disclosureLabel={{ open: 'Hide options', closed: 'Show options' }}
      onQueryChange={(value) => {
        setQuery(value);
        setActiveIndex(0);
      }}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setQuery('');
      }}
      onActiveIndex={setActiveIndex}
      onSelect={(id) => {
        setSelectedId(id);
        setOpen(false);
        setQuery('');
      }}
    />
  );
}

/** Hidden reference for the shared layout. Not linked from navigation. */
export function StyleGuidePage() {
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');
  const [tableVisibility, setTableVisibility] = useState<TableColumnVisibility>(() =>
    defaultTableColumnVisibility(TABLE_COLUMNS),
  );

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const meta = existing ?? document.createElement('meta');
    const created = !existing;
    const previous = meta.getAttribute('content');
    meta.name = 'robots';
    meta.content = 'noindex';
    if (created) document.head.appendChild(meta);
    return () => {
      if (created) {
        meta.remove();
        return;
      }
      if (previous == null) meta.removeAttribute('content');
      else meta.content = previous;
    };
  }, []);

  return (
    <PageContainer className="flex flex-col gap-8 pb-8">
      <header className="flex flex-col gap-2">
        <PageTitle>Style guide</PageTitle>
        <p className="text-sm text-text-2">
          Shared tokens and controls. This route is not in the navigation.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="sg-color">
        <SectionHeader id="sg-color" size="section">
          Color
        </SectionHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SWATCHES.map(([name, label]) => (
            <TokenSwatch key={name} name={name} label={label} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-type">
        <SectionHeader id="sg-type" size="section">
          Type
        </SectionHeader>
        <ul className="flex flex-col gap-2">
          {TYPE_STEPS.map(([step, label]) => (
            <li key={step} className={`${step} text-heading`}>
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-space">
        <SectionHeader id="sg-space" size="section">
          Spacing, controls, tiles, radii, borders
        </SectionHeader>
        <ul className="flex flex-col gap-2">
          {SPACE_STEPS.map(([step, size]) => (
            <li key={step} className="flex items-center gap-3 text-sm text-text">
              <span
                className="h-control w-16 bg-surface-2"
                style={{ width: `var(--space-${step})` }}
              />
              space-{step} · {size}
            </li>
          ))}
        </ul>
        <p className="text-sm text-text">
          Compact control {`2rem`} · touch target 44px · thumb 2.25rem · tile gap 6px · catalog
          gutter 8px / 12px · border 1px · reading column 70ch
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="h-control w-16 rounded-md border border-border bg-surface" />
          <div className="h-touch w-16 rounded-md border border-border bg-surface" />
          <div className="w-thumb">
            <div className="aspect-card w-full rounded-sm bg-surface-2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {RADIUS_STEPS.map(([step, label]) => (
            <div key={step} className={`size-12 border border-border bg-surface-2 ${step}`}>
              <span className="sr-only">radius {label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-buttons">
        <SectionHeader id="sg-buttons" size="section">
          Buttons
        </SectionHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="primary" disabled>
            Primary disabled
          </Button>
          <Button>Secondary</Button>
          <Button disabled>Secondary disabled</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="toolbar">Filters</Button>
          <Button variant="icon" aria-label="Icon button">
            +
          </Button>
          <Button variant="quiet" aria-label="Quiet button">
            ⋯
          </Button>
          <ToolbarIconButton label="Search card pool">
            <SearchIcon />
          </ToolbarIconButton>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-fields">
        <SectionHeader id="sg-fields" size="section">
          Fields
        </SectionHeader>
        <Input aria-label="Empty field" placeholder="Empty" />
        <Input aria-label="Filled field" defaultValue="Dark Magician" />
        <Input aria-label="Disabled field" defaultValue="Disabled" disabled />
        <Input field="inset" aria-label="Inset field" placeholder="Inset search" />
        <Input field="compact" aria-label="Compact field" placeholder="Compact" />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-combo">
        <SectionHeader id="sg-combo" size="section">
          Combobox
        </SectionHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <DemoCombobox openByDefault={false} />
          <DemoCombobox openByDefault />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-menu">
        <SectionHeader id="sg-menu" size="section">
          Menu
        </SectionHeader>
        <Menu
          label="Sample actions"
          trigger="Actions"
          triggerClassName="inline-flex h-control items-center rounded-md border border-border bg-surface px-control-x text-sm font-medium text-heading"
          items={[
            { key: 'rename', label: 'Rename', onSelect: () => undefined },
            { key: 'delete', label: 'Delete', onSelect: () => undefined },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-toolbar">
        <SectionHeader id="sg-toolbar" size="section">
          Toolbar
        </SectionHeader>
        <Toolbar
          search={
            <Input type="search" aria-label="Toolbar search" placeholder="Name or passcode" />
          }
          actions={
            <>
              <ToolbarIconButton label="Search card pool">
                <SearchIcon />
              </ToolbarIconButton>
              <CatalogViewToggle value={viewMode} onChange={setViewMode} />
            </>
          }
        >
          <Button variant="toolbar">
            Filters
            <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-surface-2 px-1.5 text-xs font-semibold tabular-nums">
              2
            </span>
          </Button>
          <Chip label="Spell" removeLabel="Remove Spell" />
          <p className="text-sm text-text-2">12 cards</p>
        </Toolbar>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-collapse">
        <SectionHeader id="sg-collapse" size="section">
          Collapsible section
        </SectionHeader>
        <CollapsibleSection title="Forbidden" titleId="sg-forbidden" count="17 cards">
          <p className="text-sm text-text-2">
            The header keeps the name on the left and the count with a chevron on the right.
            Sections start open.
          </p>
        </CollapsibleSection>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-table">
        <SectionHeader id="sg-table" size="section">
          Table
        </SectionHeader>
        <TableToolbar
          columns={TABLE_COLUMNS}
          visibility={tableVisibility}
          onVisibilityChange={setTableVisibility}
        />
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                {TABLE_COLUMNS.filter((column) =>
                  isTableColumnVisible(column, tableVisibility),
                ).map((column) => (
                  <th key={column.id} scope="col" className={tableHeadCellClass}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {TABLE_COLUMNS.filter((column) =>
                  isTableColumnVisible(column, tableVisibility),
                ).map((column) => (
                  <td key={column.id} className={tableCellClass}>
                    {TABLE_CELLS[column.id]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-grids">
        <SectionHeader id="sg-grids" size="section">
          Grids and rows
        </SectionHeader>
        <SectionHeader>Search</SectionHeader>
        <CardGrid variant="search">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((label) => (
            <PlaceholderTile key={label} label={label} />
          ))}
        </CardGrid>
        <SectionHeader>Side search and lists</SectionHeader>
        <CardGrid variant="lists">
          {['1', '2', '3', '4'].map((label) => (
            <PlaceholderTile key={label} label={label} />
          ))}
        </CardGrid>
        <SectionHeader>Deck list</SectionHeader>
        <CardGrid variant="deck">
          {Array.from({ length: 10 }, (_, index) => (
            <PlaceholderTile key={index} label={String(index + 1)} />
          ))}
        </CardGrid>
        <div className={listRowLinkClass}>
          <ListThumb>
            <div className="aspect-card w-full bg-surface-2" />
          </ListThumb>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-heading">Dark Magician</p>
            <p className="truncate text-xs text-text-2">Normal Monster</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sg-measure">
        <SectionHeader id="sg-measure" size="section">
          Page width
        </SectionHeader>
        <PageContainer width="reading" className="rounded-md border border-border bg-surface p-4">
          <p className="text-base text-text">
            Reading column, about seventy characters wide, for prose such as About.
          </p>
        </PageContainer>
      </section>
    </PageContainer>
  );
}
