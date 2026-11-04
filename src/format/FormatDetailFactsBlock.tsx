import type { ReactNode } from 'react';

import type { FormatDetailFacts, FormatSourceLink } from './formatDetailFacts.ts';

const DETAILS_BOX_CLASS =
  'min-w-0 w-full rounded-md border border-border bg-surface p-3 text-text-2';

const CONTENT_WIDTH_CLASS = 'max-w-[70ch]';

const WRAP_CLASS = 'min-w-0 break-words';

const VALUE_CLASS = `text-sm leading-snug text-heading ${WRAP_CLASS}`;

const ROW_CLASS = `border-b border-border py-2 last:border-b-0 ${WRAP_CLASS}`;

const LABEL_CLASS = `text-xs leading-snug text-text-2 ${WRAP_CLASS}`;

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ROW_CLASS}>
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd className={`mt-0.5 ${VALUE_CLASS}`}>{children}</dd>
    </div>
  );
}

function SourceLinksStacked({ links }: { links: readonly FormatSourceLink[] }) {
  return (
    <ul className={`flex flex-col gap-0 leading-snug ${WRAP_CLASS}`}>
      {links.map((link) => (
        <li key={link.href} className="min-w-0">
          <a
            href={link.href}
            className={`${VALUE_CLASS} hover:underline hover:underline-offset-2`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FormatDetailFactsBlock({ facts }: { facts: FormatDetailFacts }) {
  const { description, banList, cardPool, sourceLinks } = facts;

  return (
    <aside className={DETAILS_BOX_CLASS} aria-label="Format details">
      <div className={`${CONTENT_WIDTH_CLASS} ${WRAP_CLASS}`}>
        {description ? (
          <p className={`mb-3 text-sm leading-relaxed text-text-2 ${WRAP_CLASS}`}>{description}</p>
        ) : null}
        <dl className={WRAP_CLASS}>
          {banList ? (
            <>
              <SpecRow label="Effective">
                <span className="tabular-nums">{banList.effectiveDate}</span>
              </SpecRow>
              <SpecRow label="Ban list">
                <span>{banList.listName}</span>
              </SpecRow>
            </>
          ) : null}
          {cardPool ? (
            <>
              <SpecRow label="Cards released by">
                <span className="tabular-nums">{cardPool.cardsReleasedBy}</span>
              </SpecRow>
              <SpecRow label="Latest set">
                <span>{cardPool.latestSet}</span>
              </SpecRow>
              {cardPool.notIncluded ? (
                <SpecRow label="Not included">
                  <span>{cardPool.notIncluded}</span>
                </SpecRow>
              ) : null}
            </>
          ) : null}
          {sourceLinks.length > 0 ? (
            <SpecRow label="Sources">
              <SourceLinksStacked links={sourceLinks} />
            </SpecRow>
          ) : null}
        </dl>
      </div>
    </aside>
  );
}
