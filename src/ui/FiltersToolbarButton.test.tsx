/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FiltersToolbarButton } from './FiltersToolbarButton.tsx';

afterEach(() => {
  cleanup();
});

describe('FiltersToolbarButton', () => {
  it('is an icon button named Filters, with a count badge when filters are active', () => {
    const { rerender } = render(<FiltersToolbarButton />);
    const idle = screen.getByRole('button', { name: 'Filters' });
    expect(idle).toHaveAttribute('title', 'Filters');
    expect(idle.className).toContain('h-control');
    expect(idle.className).toContain('w-control');
    expect(idle.textContent).toBe('');
    expect(idle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<FiltersToolbarButton count={1} />);
    const active = screen.getByRole('button', { name: 'Filters, 1 active' });
    expect(active).toHaveAttribute('title', 'Filters, 1 active');
    expect(active.textContent).toBe('1');
  });
});
