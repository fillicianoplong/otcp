import { Link } from 'react-router';

import type { YugiohCard } from '../shared/schema/card.ts';
import { BanThumbMarker } from './BanThumbMarker.tsx';
import { buildSearchCardDetailPath } from './searchCardLinks.ts';
import type { CardDetailLinkState } from './searchNavigation.ts';
import { cardDetailLinkStateFromSearch } from './searchNavigation.ts';
import { CatalogArtImage } from './CatalogArtImage.tsx';
import { catalogGridTileAriaLabel } from './catalogArtTileLabel.ts';
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

function ListRowThumbnail({
  card,
  imageId,
  formatParam,
}: {
  card: YugiohCard;
  imageId?: number;
  formatParam: string | null | undefined;
}) {
  const formatActive = isFormatBanContextActive(formatParam);
  const banStatus = resolveCardBanForFormat(card, formatParam);
  const artId = imageId ?? card.id;

  return (
    <div className="relative w-9 shrink-0 overflow-hidden rounded-sm bg-surface-2 md:w-9">
      <CatalogArtImage
        card={card}
        imageId={artId}
        size="small"
        alt=""
        loading="lazy"
        imgClassName="aspect-[59/86] w-full object-cover"
      />
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
  imageId,
  searchQuery,
  formatParam,
  onBeforeNavigate,
  detailPath: detailPathOverride,
  linkState,
}: {
  card: YugiohCard;
  imageId?: number;
  searchQuery: string;
  formatParam: string | null | undefined;
  onBeforeNavigate?: () => void;
  detailPath?: string;
  linkState?: CardDetailLinkState;
}) {
  const typeLine = buildListRowTypeLine(card);
  const levelLine = buildListRowLevelLine(card);
  const statsLine = buildListRowStatsLine(card);

  const detailPath =
    detailPathOverride ??
    buildSearchCardDetailPath(card.id, { searchQuery, formatParam, artId: imageId });
  const tileLabel = imageId != null ? catalogGridTileAriaLabel(card, imageId) : card.name;

  return (
    <li>
      <Link
        to={detailPath}
        state={linkState ?? cardDetailLinkStateFromSearch()}
        onClick={onBeforeNavigate}
        aria-label={tileLabel}
        className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 rounded-md border border-border bg-surface px-2 py-2 transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong md:grid-cols-[2.25rem_minmax(10rem,1.6fr)_minmax(9rem,1.2fr)_5.75rem_minmax(8.5rem,1fr)_2.25rem] md:items-center"
      >
        <ListRowThumbnail card={card} imageId={imageId} formatParam={formatParam} />
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
