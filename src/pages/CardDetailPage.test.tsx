/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { OTCP_DATASET_SCHEMA_VERSION } from '../shared/schema/constants.ts';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { CardDetailPage } from './CardDetailPage.tsx';

function mockCatalogFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('data/current.json')) {
        return new Response(
          JSON.stringify({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
            datasetFile: 'data/datasets/sample-dev.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: sampleDevDataset.cards.length,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('data/datasets/sample-dev.json')) {
        return new Response(JSON.stringify(sampleDevDataset), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

function renderDetail(cardId: number) {
  return render(
    <MemoryRouter initialEntries={[`/search/card/${cardId}`]}>
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
});
