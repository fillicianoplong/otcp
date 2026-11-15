/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { CollapsibleSection } from './CollapsibleSection.tsx';

afterEach(() => {
  cleanup();
});

describe('CollapsibleSection', () => {
  it('starts open and closes from the header', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Forbidden" titleId="forbidden-heading" count="17 cards">
        <p>Dark Hole</p>
      </CollapsibleSection>,
    );

    const details = document.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(true);
    expect(screen.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeTruthy();
    expect(screen.getByText('17 cards')).toBeTruthy();
    expect(screen.getByText('Dark Hole')).toBeTruthy();

    await user.click(screen.getByText('Forbidden'));
    expect(details?.open).toBe(false);
  });
});
