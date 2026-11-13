/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BAN_THUMB_MARKER_WIDTH_CLASS, BanThumbMarker } from '../../src/catalog/BanThumbMarker.tsx';

afterEach(() => {
  cleanup();
});

describe('BanThumbMarker', () => {
  it('overlays the card scan top-left at proportional width', () => {
    const { container } = render(<BanThumbMarker status="Limited" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toMatch(/\bleft-0\b/);
    expect(wrapper.className).toMatch(/\btop-0\b/);
    expect(wrapper.className).toContain(BAN_THUMB_MARKER_WIDTH_CLASS);

    const image = screen.getByRole('img', { name: 'Limited' });
    expect(image.className).toMatch(/\bw-full\b/);
    expect(image.className).toMatch(/\baspect-square\b/);
  });
});
