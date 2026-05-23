import { Link } from 'react-router';
import { useState } from 'react';

import type { YugiohCard } from '../shared/schema/card.ts';
import { BanThumbMarker } from './BanThumbMarker.tsx';
import {
  banMarkerForStatus,
  isFormatBanContextActive,
  resolveCardBanForFormat,
} from './formatBanContext.ts';
import { resolveYgoBanStatusIconPath } from './cardIcons.ts';
import {
  buildListRowLevelLine,
  buildListRowStatsLine,
  buildListRowTypeLine,
} from './listRowModel.ts';
import { ListRowCompactIcons } from './ListRowCompactIcons.tsx';
import { YgoCardIcon } from '../components/YgoCardIcon.tsx';

function ListRowNoImageThumb({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex aspect-[59/86] w-full flex-col items-center justify-center rounded-sm bg-surface-2 text-center text-text-2 ${
        compact ? 'gap-0 px-0.5 text-[9px] leading-tight' : 'gap-1 px-2 text-xs'
      }`}
    >
      <span>No image</span>
    </div>
  );
}

function ListRowThumbnail({
  card,
  formatParam,
}: {
  card: YugiohCard;
  formatParam: string | null | undefined;
}) {
  const [missing, setMissing] = useState(false);
  const formatActive = isFormatBanContextActive(formatParam);
  const banStatus = resolveCardBanForFormat(card, formatParam);

  return (
    <div className="relative w-9 shrink-0 overflow-hidden rounded-sm bg-surface-2 md:w-9">
      {missing ? (
        <ListRowNoImageThumb compact />
      ) : (
        <img
          src={card.images.small}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setMissing(true)}
          className="aspect-[59/86] w-full object-cover"
        />
      )}
      {formatActive && banStatus ? (
        <BanThumbMarker status={banStatus} className="md:hidden" />
      ) : null}
    </div>
  );
}

function ListRowBanCell({
  card,
  formatParam,
}: {
  card: YugiohCard;
  formatParam: string | null | undefined;
}) {
  if (!isFormatBanContextActive(formatParam)) {
    return (
      <span className="max-md:hidden text-xs text-text-2" aria-hidden>
        —
      </span>
    );
  }

  const status = resolveCardBanForFormat(card, formatParam);
  if (!status) {
    return (
      <span className="max-md:hidden text-xs text-text-2" aria-hidden>
        —
      </span>
    );
  }

  const { label } = banMarkerForStatus(status);
  return (
    <span className="max-md:hidden" title={label}>
      <YgoCardIcon
        src={resolveYgoBanStatusIconPath(status, 'row')}
        label={label}
        tier="row"
        iconOnly
      />
    </span>
  );
}

export function CardListRow({
  card,
  searchQuery,
  formatParam,
  onBeforeNavigate,
}: {
  card: YugiohCard;
  searchQuery: string;
  formatParam: string | null | undefined;
  onBeforeNavigate: () => void;
}) {
  const typeLine = buildListRowTypeLine(card);
  const levelLine = buildListRowLevelLine(card);
  const statsLine = buildListRowStatsLine(card);

  const detailPath =
    searchQuery.length > 0
      ? `/search/card/${card.id}?q=${encodeURIComponent(searchQuery)}`
      : `/search/card/${card.id}`;

  return (
    <li>
      <Link
        to={detailPath}
        state={{ fromSearch: true }}
        onClick={onBeforeNavigate}
        className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 rounded-md border border-border bg-surface px-2 py-2 transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong md:grid-cols-[2.25rem_minmax(10rem,1.6fr)_minmax(9rem,1.2fr)_5.75rem_minmax(8.5rem,1fr)_2.25rem] md:items-center"
      >
        <ListRowThumbnail card={card} formatParam={formatParam} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-heading">{card.name}</p>
          <ListRowCompactIcons card={card} />
        </div>
        <span className="max-md:hidden min-w-0 truncate text-left text-xs text-text-2">
          {typeLine}
        </span>
        <span className="max-md:hidden text-left text-xs tabular-nums text-text-2">
          {levelLine ?? '—'}
        </span>
        <span className="max-md:hidden text-left text-xs tabular-nums text-text-2">
          {statsLine ?? '—'}
        </span>
        <ListRowBanCell card={card} formatParam={formatParam} />
      </Link>
    </li>
  );
}
