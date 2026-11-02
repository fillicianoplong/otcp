import type { YugiohCard } from '../shared/schema/card.ts';
import { buildListRowLevelLine, buildListRowTypeLine } from './listRowModel.ts';
import {
  resolveListRowLevelIconPath,
  resolveListRowTypeIconPath,
  resolveYgoAtkIconPath,
  resolveYgoAttributeIconPath,
  resolveYgoDefIconPath,
} from './cardIcons.ts';
import {
  catalogTableAtkCell,
  catalogTableDefCell,
  catalogTableLevelCell,
} from './catalogTableColumns.ts';
import { YgoCardIcon } from '../components/YgoCardIcon.tsx';

const compactValueClass = 'text-[10px] leading-none tabular-nums text-text-2';

function CompactIconWithValue({
  src,
  label,
  value,
}: {
  src: string | null | undefined;
  label: string;
  value: string;
}) {
  if (!src || value === '—') {
    return null;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5">
      <YgoCardIcon src={src} label={label} tier="row" iconOnly />
      <span className={compactValueClass} aria-hidden>
        {value}
      </span>
    </span>
  );
}

function spellOrTrap(card: YugiohCard): boolean {
  return card.type.includes('Spell') || card.type.includes('Trap');
}

/** Compact icon row for list view below the 768px breakpoint. */
export function ListRowCompactIcons({ card }: { card: YugiohCard }) {
  if (spellOrTrap(card)) {
    const typeLine = buildListRowTypeLine(card);
    const typeIcon = resolveListRowTypeIconPath(card);
    return (
      <div
        className="mt-0.5 hidden max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-2 max-md:gap-y-1"
        data-testid="list-row-compact-icons"
      >
        <YgoCardIcon src={typeIcon} label={typeLine} tier="row" iconOnly />
      </div>
    );
  }

  const levelLine = buildListRowLevelLine(card);
  const levelIcon = resolveListRowLevelIconPath(card);
  const levelValue = catalogTableLevelCell(card);
  const typeIcon = resolveListRowTypeIconPath(card);
  const raceLabel = card.race?.trim() || buildListRowTypeLine(card);
  const attribute = card.attribute ?? '';
  const attrIcon = resolveYgoAttributeIconPath(attribute, 'row');
  const atkValue = catalogTableAtkCell(card);
  const defValue = catalogTableDefCell(card);
  const atkLabel = `ATK ${atkValue}`;
  const defLabel = `DEF ${defValue}`;

  return (
    <div
      className="mt-0.5 hidden max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-2 max-md:gap-y-1"
      data-testid="list-row-compact-icons"
    >
      {attribute ? <YgoCardIcon src={attrIcon} label={attribute} tier="row" iconOnly /> : null}
      {levelLine ? (
        <CompactIconWithValue src={levelIcon} label={levelLine} value={levelValue} />
      ) : null}
      <YgoCardIcon src={typeIcon} label={raceLabel} tier="row" iconOnly />
      <CompactIconWithValue src={resolveYgoAtkIconPath('row')} label={atkLabel} value={atkValue} />
      {card.linkRating == null ? (
        <CompactIconWithValue
          src={resolveYgoDefIconPath('row')}
          label={defLabel}
          value={defValue}
        />
      ) : null}
    </div>
  );
}
