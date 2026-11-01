/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import validDataset from '../../tests/fixtures/schema/dataset-valid.json';
import { OTCP_DATASET_SCHEMA_VERSION } from '../shared/schema/constants.ts';
import { CardCatalogProvider } from './CardCatalogProvider.tsx';
import { CardCatalogView } from './CardCatalogView.tsx';
import { clearCardCatalogCache } from './loadCatalog.ts';

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
            cardCount: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('data/datasets/sample-dev.json')) {
        return new Response(JSON.stringify(validDataset), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

function renderGrid() {
  return render(
    <MemoryRouter>
      <CardCatalogProvider>
        <CardCatalogView headingId="search-results" />
      </CardCatalogProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  clearCardCatalogCache();
  vi.unstubAllGlobals();
});

describe('CardCatalogView grid tiles', () => {
  beforeEach(() => {
    mockCatalogFetch();
  });

  it('shows art-only tiles with accessible names and no caption', async () => {
    renderGrid();

    const link = await screen.findByRole('link', { name: 'Blue-Eyes White Dragon' });
    expect(link.className).not.toMatch(/\bborder-border\b/);
    expect(link.className).not.toMatch(/\bbg-surface\b/);

    const image = within(link).getByRole('img', { name: 'Blue-Eyes White Dragon' });
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(screen.queryByText('Blue-Eyes White Dragon', { selector: 'p' })).toBeNull();
  });

  it('shows the card name on the no-image fallback', async () => {
    renderGrid();

    await screen.findByRole('link', { name: 'Blue-Eyes White Dragon' });
    const image = screen.getByRole('img', { name: 'Blue-Eyes White Dragon' });
    image.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(screen.getByText('No image')).toBeTruthy();
      expect(screen.getByText('Blue-Eyes White Dragon', { selector: 'span' })).toBeTruthy();
    });
  });
});
