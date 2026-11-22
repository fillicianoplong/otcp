/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { YGO_CARD_ART_ASPECT_CLASS } from '../catalog/cardArtUrl.ts';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../shared/schema/constants.ts';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { CardDetailPage } from './CardDetailPage.tsx';

type SampleDataset = typeof sampleDevDataset;

/** Dark Magician with seven printings, so the Sets table starts collapsed with a Show all button. */
function datasetWithManyDarkMagicianSets(): SampleDataset {
  const copy = structuredClone(sampleDevDataset) as SampleDataset;
  const card = copy.cards.find((entry) => entry.id === 46986420);
  if (!card) throw new Error('Dark Magician missing from the sample dataset');
  card.sets = [
    { setCode: 'SDY-006', setName: 'Starter Deck: Yugi', setRarity: 'Ultra Rare' },
    { setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', setRarity: 'Ultra Rare' },
    { setCode: 'DB1-EN101', setName: 'Dark Beginning 1', setRarity: 'Ultra Rare' },
    {
      setCode: 'YGLD-ENA03',
      setName: "Yugi's Legendary Decks: Collector's Box Set with an Extra Long Name",
      setRarity: 'Quarter Century Secret Rare',
    },
    { setCode: 'LDK2-ENY10', setName: 'Legendary Decks II', setRarity: 'Common' },
    {
      setCode: 'SS01-ENA01',
      setName: 'Speed Duel Starter Decks: Destiny Masters',
      setRarity: 'Common',
    },
    { setCode: 'YGLD-ENB02', setName: "Yugi's Legendary Decks", setRarity: 'Common' },
  ] as SampleDataset['cards'][number]['sets'];
  return copy;
}

function mockCatalogFetch(dataset: SampleDataset = sampleDevDataset): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('data/current.json')) {
        return new Response(
          JSON.stringify({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            datasetFile: 'data/datasets/sample-dev.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: sampleDevDataset.cards.length,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('data/datasets/sample-dev.json')) {
        return new Response(JSON.stringify(dataset), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

function renderDetail(cardId: number, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/search/card/${cardId}`, state }]}>
      <CardCatalogProvider>
        <Routes>
          <Route path="/search/card/:id" element={<CardDetailPage />} />
        </Routes>
      </CardCatalogProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  clearCardCatalogCache();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

describe('CardDetailPage artwork', () => {
  beforeEach(() => {
    mockCatalogFetch();
  });

  it('frames card art at the published image aspect ratio', async () => {
    renderDetail(46986420);

    const trigger = await screen.findByRole('button', {
      name: 'View larger artwork for Dark Magician',
    });
    const frame = trigger.firstElementChild;
    expect(frame?.className).toContain(YGO_CARD_ART_ASPECT_CLASS);
    expect(frame?.className).not.toContain('aspect-[63/88]');

    const img = trigger.querySelector('img');
    expect(img?.className).toContain('object-cover');
    expect(frame?.className).not.toMatch(/100vh|820px/);

    const column = trigger.parentElement;
    expect(column?.className).toContain('w-full');
    expect(column?.className).not.toContain('max-w-[20rem]');
    expect(column?.className).toContain(
      'md:w-[min(42rem,calc((100dvh-10rem)*421/614),calc(100%-25rem))]',
    );
    expect(column?.parentElement?.className).toContain('md:gap-12');
  });

  it('lists alternate artworks beside the info and selecting one updates the main art', async () => {
    const user = userEvent.setup();
    renderDetail(46986420);

    const zoom = await screen.findByRole('button', {
      name: 'View larger artwork for Dark Magician',
    });
    const description = screen.getByRole('heading', { name: 'Description' });
    const artworks = screen.getByRole('region', { name: 'Artworks' });
    const prices = screen.getByRole('heading', { name: 'Market prices' });
    expect(zoom.contains(artworks)).toBe(false);
    expect(
      description.compareDocumentPosition(artworks) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      artworks.compareDocumentPosition(prices) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(artworks).getAllByRole('button')).toHaveLength(5);
    expect(
      within(artworks)
        .getByRole('button', {
          name: 'Show artwork 46986420 for Dark Magician',
        })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    await user.click(
      within(artworks).getByRole('button', {
        name: 'Show artwork 46986421 for Dark Magician',
      }),
    );

    await waitFor(() => {
      expect(
        screen
          .getByRole('button', { name: 'Show artwork 46986421 for Dark Magician' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });
    const img = screen
      .getByRole('button', { name: 'View larger artwork for Dark Magician' })
      .querySelector('img');
    expect(img?.getAttribute('src') ?? '').toContain('46986421');
  });

  it('omits the artworks section when the card has a single artwork', async () => {
    renderDetail(89631139);

    await screen.findByRole('heading', { name: 'Blue-Eyes White Dragon', level: 1 });
    expect(screen.queryByRole('heading', { name: 'Artworks' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Artwork variants' })).toBeNull();
  });

  it('opens and closes the zoom viewer from the card trigger with keyboard', async () => {
    const user = userEvent.setup();
    renderDetail(46986420);

    const trigger = await screen.findByRole('button', {
      name: 'View larger artwork for Dark Magician',
    });
    trigger.focus();
    await user.keyboard('{Enter}');

    screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it('opens the zoom viewer when Space activates the focused trigger', async () => {
    const user = userEvent.setup();
    renderDetail(46986420);

    const trigger = await screen.findByRole('button', {
      name: 'View larger artwork for Dark Magician',
    });
    trigger.focus();
    await user.keyboard(' ');

    screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
  });

  it('does not render an in-page back link', async () => {
    renderDetail(46986420);
    await screen.findByRole('heading', { level: 1, name: 'Dark Magician' });
    expect(screen.queryByRole('link', { name: /Back to/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Back to/ })).toBeNull();
  });
});

describe('CardDetailPage sets table', () => {
  beforeEach(() => {
    mockCatalogFetch(datasetWithManyDarkMagicianSets());
  });

  function setsTable() {
    return screen.getByRole('region', { name: 'Sets (7)' });
  }

  it('marks the printing of the art on screen with a picture icon instead of a text tag', async () => {
    renderDetail(46986414);

    await screen.findByRole('heading', { name: 'Sets (7)' });
    const region = setsTable();
    await waitFor(() => {
      expect(within(region).getAllByRole('img', { name: 'Uses this art' }).length).toBeGreaterThan(
        0,
      );
    });
    const icon = within(region).getAllByRole('img', { name: 'Uses this art' })[0];
    expect(icon.getAttribute('title')).toBe('Uses this art');
    expect(icon.querySelector('svg')).not.toBeNull();
    expect(within(region).queryByText(/^this art$/i)).toBeNull();
    expect(
      within(region).getByRole('link', {
        name: 'Search for cards in Starter Deck: Yugi. Uses this art.',
      }),
    ).toBeInTheDocument();
  });

  it('lets set names and rarities wrap so the table fits a narrow card', async () => {
    renderDetail(46986414);

    await screen.findByRole('heading', { name: 'Sets (7)' });
    const region = setsTable();
    expect(region.className).toContain('@container');
    const row = within(region).getAllByRole('row')[1];
    const [setCell, , rarityCell, releasedCell] = within(row).getAllByRole('cell');
    expect(setCell.className).not.toContain('whitespace-nowrap');
    expect(rarityCell.className).not.toContain('whitespace-nowrap');
    expect(releasedCell.className).not.toMatch(/(^|\s)whitespace-nowrap/);
    const link = within(setCell).getByRole('link');
    expect(link.className).not.toContain('truncate');
    expect(link.className).toContain('[overflow-wrap:anywhere]');
  });

  it('keeps all sets showing when switching to another artwork', async () => {
    const user = userEvent.setup();
    renderDetail(46986414);

    await screen.findByRole('heading', { name: 'Sets (7)' });
    expect(within(setsTable()).getAllByRole('row')).toHaveLength(6);
    await user.click(screen.getByRole('button', { name: 'Show all 7 sets' }));
    expect(within(setsTable()).getAllByRole('row')).toHaveLength(8);

    await user.click(
      within(screen.getByRole('region', { name: 'Artworks' })).getByRole('button', {
        name: 'Show artwork 46986415 for Dark Magician',
      }),
    );
    await waitFor(() => {
      expect(
        screen
          .getByRole('button', { name: 'Show artwork 46986415 for Dark Magician' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });
    expect(within(setsTable()).getAllByRole('row')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show all 7 sets' })).toBeNull();
  });

  it('starts collapsed on a fresh visit and expanded when history says so', async () => {
    renderDetail(46986414);
    await screen.findByRole('button', { name: 'Show all 7 sets' });
    cleanup();
    clearCardCatalogCache();

    renderDetail(46986414, { cardDetailSetsExpanded: true });
    await screen.findByRole('button', { name: 'Show fewer' });
    expect(within(setsTable()).getAllByRole('row')).toHaveLength(8);
  });
});
