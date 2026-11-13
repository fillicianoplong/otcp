/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listFormatsNewestFirst } from './formatCatalog.ts';
import { FormatFilterGroup } from './FormatFilterGroup.tsx';

afterEach(() => {
  cleanup();
});

function optionNames(): string[] {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('FormatFilterGroup combobox', () => {
  it('stays a single closed select until opened', () => {
    render(<FormatFilterGroup value={null} onChange={() => {}} />);

    const combobox = screen.getByRole('combobox', { name: 'Format' });
    expect(combobox).toBeInstanceOf(HTMLInputElement);
    expect((combobox as HTMLInputElement).value).toBe('All formats');
    expect(combobox.className).toContain('font-normal');
    expect(combobox.className).not.toMatch(/\bfont-(medium|semibold|bold)\b/);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('filters names without radio circles and keeps catalog order', async () => {
    const user = userEvent.setup();
    render(<FormatFilterGroup value={null} onChange={() => {}} />);

    await user.click(screen.getByRole('combobox', { name: 'Format' }));

    const names = optionNames();
    expect(names.slice(0, 5)).toEqual([
      'All formats',
      'Advanced',
      'Traditional',
      'Speed Duel',
      'Genesys',
    ]);
    expect(names.slice(1)).toEqual(listFormatsNewestFirst().map((format) => format.name));
    expect(screen.queryByRole('radio')).toBeNull();

    await user.keyboard('goat');
    expect(optionNames()).toEqual(['GOAT']);
    expect(screen.queryByText('April 2005 list · pool through Aug 2005')).toBeNull();
  });

  it('shows the selected format in regular weight', async () => {
    const user = userEvent.setup();
    render(<FormatFilterGroup value="advanced" onChange={() => {}} />);

    const combobox = screen.getByRole('combobox', { name: 'Format' });
    expect((combobox as HTMLInputElement).value).toBe('Advanced');
    expect(combobox.className).not.toMatch(/\bfont-(medium|semibold|bold)\b/);

    await user.click(combobox);
    const selected = screen.getByRole('option', { name: 'Advanced' });
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.className).toContain('font-normal');
    expect(selected.className).not.toMatch(/\bfont-(medium|semibold|bold)\b/);
    expect(selected.querySelector('[class*="rounded-full"]')).toBeNull();
  });

  it('selects with the keyboard the same way as a click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormatFilterGroup value={null} onChange={onChange} />);

    const combobox = screen.getByRole('combobox', { name: 'Format' });
    await user.click(combobox);
    await user.keyboard('edison');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('edison');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('moves with arrows, and Escape closes without changing the format', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onDocumentKeyDown = vi.fn();
    document.addEventListener('keydown', onDocumentKeyDown);

    try {
      render(<FormatFilterGroup value={null} onChange={onChange} />);
      const combobox = screen.getByRole('combobox', { name: 'Format' });
      combobox.focus();
      await user.keyboard('{ArrowDown}{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('advanced');

      onChange.mockClear();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('listbox')).toBeTruthy();
      onDocumentKeyDown.mockClear();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(onDocumentKeyDown).not.toHaveBeenCalled();
      expect((combobox as HTMLInputElement).value).toBe('All formats');
    } finally {
      document.removeEventListener('keydown', onDocumentKeyDown);
    }
  });

  it('shows the selected name and chevron without a clear control', () => {
    render(<FormatFilterGroup value="advanced" onChange={() => {}} />);

    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'Advanced',
    );
    expect(screen.queryByRole('button', { name: 'Clear format' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show formats' })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('returns to every format from All formats or typeahead', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<FormatFilterGroup value="genesys" onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    await user.click(screen.getByRole('option', { name: 'All formats' }));
    expect(onChange).toHaveBeenCalledWith(null);

    onChange.mockClear();
    rerender(<FormatFilterGroup value={null} onChange={onChange} />);
    screen.getByRole('combobox', { name: 'Format' }).focus();
    await user.keyboard('s');
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe('s');
    const names = optionNames();
    expect(names.every((name) => name.toLowerCase().includes('s'))).toBe(true);
    expect(names).toContain('Speed Duel');
    expect(names).not.toContain('Advanced');
  });

  it('omits the empty option when a format is required', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormatFilterGroup value="goat" onChange={onChange} allowEmpty={false} />);

    const combobox = screen.getByRole('combobox', { name: 'Format' });
    expect((combobox as HTMLInputElement).value).toBe('GOAT');
    combobox.focus();
    await user.keyboard('{Backspace}');
    expect(onChange).not.toHaveBeenCalled();

    await user.click(combobox);
    expect(screen.queryByRole('option', { name: 'All formats' })).toBeNull();
    expect(optionNames()[0]).toBe('Advanced');
  });

  it('keeps the open list within the field width', async () => {
    const user = userEvent.setup();
    render(
      <div style={{ width: 390 }}>
        <FormatFilterGroup value={null} onChange={() => {}} />
      </div>,
    );

    const root = screen.getByRole('combobox', { name: 'Format' }).closest('.relative');
    expect(root?.className).toContain('min-w-0');
    expect(root?.className).toContain('max-w-full');

    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    const list = screen.getByRole('listbox', { name: 'Format' });
    expect(list.className).toContain('left-0');
    expect(list.className).toContain('right-0');
    expect(list.className).toContain('w-full');
    expect(list.className).toContain('max-w-full');
    expect(list.className).toContain('overflow-x-hidden');
    expect(list.className).not.toMatch(/\bmin-w-(?!0\b)/);
    expect(root?.className).not.toMatch(/\bmin-w-(?!0\b)/);
  });
});
