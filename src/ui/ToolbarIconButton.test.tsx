/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { toolbarToggleButtonClass } from './classes.ts';
import { SearchIcon, ToolbarIconButton } from './ToolbarIconButton.tsx';

afterEach(() => {
  cleanup();
});

describe('ToolbarIconButton', () => {
  it('is a square control with the toggle chrome and a tooltip', () => {
    render(
      <ToolbarIconButton label="Search card pool">
        <SearchIcon />
      </ToolbarIconButton>,
    );

    const button = screen.getByRole('button', { name: 'Search card pool' });
    expect(button).toHaveAttribute('title', 'Search card pool');
    expect(button.className).toContain('h-control');
    expect(button.className).toContain('w-control');
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('border-border');
    expect(button.className).toContain('bg-surface');
    expect(button.className).toContain('hover:border-border-strong');
    expect(button.className).toContain('hover:text-heading');
    for (const token of ['h-control', 'w-control', 'border-border', 'bg-surface'] as const) {
      expect(toolbarToggleButtonClass).toContain(token);
    }
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
