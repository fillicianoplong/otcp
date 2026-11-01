/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CARD_IMAGE_VIEWER_ACTUAL_STAGE_CLASS,
  CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS,
  CARD_IMAGE_VIEWER_FIT_STAGE_CLASS,
  CardImageZoomViewer,
} from './CardImageZoomViewer.tsx';

function ViewerHarness() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);

  return (
    <>
      <button ref={triggerRef} type="button">
        Card artwork
      </button>
      {open ? (
        <CardImageZoomViewer
          src="/otcp/card-images/46986420.jpg"
          alt="Dark Magician"
          onClose={() => setOpen(false)}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('CardImageZoomViewer', () => {
  it('locks page scroll and exposes an accessible dialog label', () => {
    render(<ViewerHarness />);

    expect(document.body.style.overflow).toBe('hidden');
    screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
  });

  it('uses a nearly opaque backdrop', () => {
    render(<ViewerHarness />);

    const dialog = screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
    expect(dialog.className).toContain('bg-black/90');
  });

  it('applies the padded stage constraint in fit mode', () => {
    render(<ViewerHarness />);

    const img = screen.getByRole('img', { name: 'Dark Magician' });
    for (const token of CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS.split(/\s+/)) {
      expect(img.className).toContain(token);
    }

    const stage = document.querySelector('[data-viewer-stage]');
    expect(stage).toBeTruthy();
    for (const token of CARD_IMAGE_VIEWER_FIT_STAGE_CLASS.split(/\s+/)) {
      expect(stage!.className).toContain(token);
    }
  });

  it('centers artwork in actual-size mode with a full-size stage and auto margins', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    await user.click(screen.getByRole('button', { name: 'Show artwork at actual size' }));

    const stage = document.querySelector('[data-viewer-stage]');
    expect(stage).toBeTruthy();
    for (const token of CARD_IMAGE_VIEWER_ACTUAL_STAGE_CLASS.split(/\s+/)) {
      expect(stage!.className).toContain(token);
    }

    const artworkControl = screen.getByRole('button', { name: 'Fit artwork to screen' });
    expect(artworkControl.className).toContain('m-auto');

    const scroll = stage!.parentElement;
    expect(scroll?.className).toContain('overflow-auto');
    expect(scroll!.scrollLeft).toBe(0);
  });

  it('closes from the close button and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const trigger = screen.getByRole('button', { name: 'Card artwork' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes when clicking the backdrop padding', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const backdrop = document.querySelector('[data-viewer-stage]');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('toggles between fit and actual size when clicking the artwork control', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const fitControl = screen.getByRole('button', { name: 'Show artwork at actual size' });
    await user.click(fitControl);
    screen.getByRole('button', { name: 'Fit artwork to screen' });

    await user.click(screen.getByRole('button', { name: 'Fit artwork to screen' }));
    screen.getByRole('button', { name: 'Show artwork at actual size' });
  });
});
