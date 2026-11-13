/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CatalogViewToggle, catalogViewToggleSelectedClass } from './CatalogViewToggle.tsx';

afterEach(() => {
  cleanup();
});

describe('CatalogViewToggle', () => {
  it('raises the selected segment so its border is not covered by neighbors', () => {
    const { rerender } = render(<CatalogViewToggle value="grid" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Grid view' }).className).toContain(
      catalogViewToggleSelectedClass,
    );
    expect(screen.getByRole('button', { name: 'List view' }).className).not.toContain(
      catalogViewToggleSelectedClass,
    );

    rerender(<CatalogViewToggle value="list" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'List view' }).className).toContain(
      catalogViewToggleSelectedClass,
    );
    expect(screen.getByRole('button', { name: 'Grid view' }).className).not.toContain(
      catalogViewToggleSelectedClass,
    );

    rerender(<CatalogViewToggle value="table" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Table view' }).className).toContain(
      catalogViewToggleSelectedClass,
    );
  });

  it('exports a stable selected-segment class token', () => {
    expect(catalogViewToggleSelectedClass).toContain('relative');
    expect(catalogViewToggleSelectedClass).toContain('z-[1]');
    expect(catalogViewToggleSelectedClass).toContain('border-border-strong');
  });
});
